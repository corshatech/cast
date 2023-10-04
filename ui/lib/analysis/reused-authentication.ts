/* Copyright 2023 Corsha.
   Licensed under the Apache License, Version 2.0 (the 'License');
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
   http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an 'AS IS' BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License. */

import { Analysis, Finding, ReusedAuthentication } from '../../lib/findings';
import { conn } from '../../lib/db';

const reusedAuthQuery = `
select
  reused.auth,
  srcCount.count,
  authTimespan.min_timestamp,
  authTimespan.max_timestamp,
  sampleRequest.id AS id,
  sampleRequest.src->>'ip' AS src_ip,
  sampleRequest.src->>'port' AS src_port,
  sampleRequest.dst->>'ip' AS dst_ip,
  sampleRequest.dst->>'port' AS dst_port,
  sampleRequest.uri,
  sampleRequest.timestamp
FROM

-- find all auth headers that have multiple sources
(
SELECT
  data->'request'->'headers'->>'Authorization' AS auth
FROM traffic
WHERE
  data->'request'->'headers'->>'Authorization' is not null
GROUP BY
  auth
HAVING
  count(distinct data->'src'->'ip') > 1
) AS reused,

-- find min and max timestamps for each reused auth header
LATERAL (
SELECT
  min(t.occurred_at) AS min_timestamp,
  max(t.occurred_at) AS max_timestamp
FROM traffic AS t
WHERE reused.auth = t.data->'request'->'headers'->>'Authorization'
GROUP BY reused.auth
) AS authTimespan,

-- find the request counts for each source that reused the auth header
LATERAL (
  SELECT
    t.data->'src'->'ip' AS src_ip,
    reused.auth AS auth,
    count(*) AS count
  FROM traffic AS t
  WHERE reused.auth = t.data->'request'->'headers'->>'Authorization'
  GROUP BY t.data->'src'->'ip', reused.auth
) AS srcCount,

-- find the most recent request made by each source that reused the auth header
LATERAL (
  SELECT
  t.id AS id,
  t.data->'src' AS src,
  t.data->'dst' AS dst,
  t.data->'request'->'absoluteURI' AS uri,
  t.occurred_at AS timestamp
  FROM traffic t
  WHERE
    srcCount.src_ip = t.data->'src'->'ip'
  AND
    srcCount.auth = t.data->'request'->'headers'->>'Authorization'
  ORDER BY t.occurred_at DESC
  LIMIT 1
) AS sampleRequest
`;

const hasGeoIPDataQuery = `SELECT COUNT(*) > 0 AS on FROM geo_ip_data;`;
const hasGeoLocationDataQuery = `SELECT COUNT(*) > 0 AS on FROM geo_location_data;`;

const geoIPQuery = `
-- Map matview traffic data with given secrets to locations with Maxmind geographic data using IP
WITH traffic_locations AS (
	SELECT DISTINCT
    auth,
    traffic_id,
    direction, 
    ip_addr,
    latitude,
    longitude,
	accuracy_radius AS error,
    country_iso_code AS country_code
	FROM matview_traffic_ips 
	JOIN (
		SELECT
      id,
      data->'request'->'headers'->>'Authorization' AS auth
		FROM traffic 
		WHERE data->'request'->'headers'->>'Authorization' = ANY($1)
	) trafficdata ON trafficdata.id = matview_traffic_ips.traffic_id
	JOIN geo_ip_data ON geo_ip_data.network >>= ip_addr::inet
	JOIN geo_location_data ON geo_location_data.geoname_id = geo_ip_data.geoname_id
)

-- Find the maximum distance and error between the points found above
SELECT *
FROM traffic_locations
FULL JOIN 
(
  -- Select relevant information from max distance points
	SELECT DISTINCT
		max_distance.dist AS max_dist,
		all_distances.auth AS max_auth,
		(all_distances.error1 + all_distances.error2) AS max_error
	FROM (
    -- Find max distance from all pairs
		SELECT
			MAX(ST_DistanceSphere(
				ST_POINT(t1.longitude, t1.latitude),
			  ST_POINT(t2.longitude, t2.latitude)
			) / 1000) AS dist -- Distance in km) 
		FROM traffic_locations t1, traffic_locations t2
		WHERE t1.auth = t2.auth
		GROUP BY t1.auth
	) max_distance
	JOIN (
    -- Find all distances to pull out relevant information for max points
		SELECT 
			t1.auth AS auth,
			t1.error AS error1,
			t2.error AS error2,
			ST_DistanceSphere(
				ST_POINT(t1.longitude, t1.latitude),
			  ST_POINT(t2.longitude, t2.latitude)
			) / 1000 AS dist
		FROM traffic_locations t1, traffic_locations t2
		WHERE t1.auth = t2.auth
	) AS all_distances 
	ON all_distances.dist = max_distance.dist 
) locations_with_max_distance ON false
`

interface ReusedAuthRow {
  auth: string;
  count: number;
  min_timestamp: Date;
  max_timestamp: Date;
  id: string;
  src_ip: string;
  src_port: string;
  dst_ip: string;
  dst_port: string;
  uri: string;
  timestamp: Date;
}

interface GeoIPRow {
  auth: string | null;
  traffic_id: string | null;
  direction: 'src' | 'dst' | null;
  ip_addr: string | null;
  latitude: number | null;
  longitude: number | null;
  error: number | null;
  country_code: string | null;
  max_auth?: string | null;
  max_dist?: number | null;
  max_error?: number | null;
}

/** group the rows by their auth header */
function groupByAuthHeader(rows: ReusedAuthRow[]): Record<string, ReusedAuthRow[]> {
  const groups: Record<string, ReusedAuthRow[]> = {};

  rows.forEach((row: ReusedAuthRow) => {
    groups[row.auth] = [...(groups[row.auth] ?? []), row];
  });

  return groups;
}

function rowsToFinding(detectedAt: string, auth: string, reusedAuthRows: ReusedAuthRow[], geoIPRows?: GeoIPRow[]): Finding {
  const occurredAt = {
    start: reusedAuthRows[0].min_timestamp.toISOString(),
    end: reusedAuthRows[0].max_timestamp.toISOString(),
  };

  // All rows for current finding should have the same secret
  const correlatedSecret = reusedAuthRows[0].auth

  const inRequests: ReusedAuthentication['data']['inRequests'] = reusedAuthRows.map(
    (x) => ({
      id: x.id,
      srcIp: x.src_ip,
      srcPort: x.src_port,
      proto: 'tcp',
      destIp: x.dst_ip,
      destPort: x.dst_port,
      URI: x.uri,
      at: x.timestamp.toISOString(),
      count: +x.count,
    }),
  );

  let geoIP: ReusedAuthentication['data']['geoIP'] = undefined;

  let maxDist = 0;
  let maxError = 0;
  const locationRows = 
    // Find max distance row and remove it
    // Remove all rows that don't include current secret
    geoIPRows?.filter(row => {
      if(row.max_dist && row.max_error && row.max_auth && row.max_auth === correlatedSecret) {
        maxDist = row.max_dist
        maxError = row.max_error
      }
      return row.max_dist === null && row.max_error === null && row.auth === correlatedSecret && row.traffic_id !== null
    })

    // Map all rows to LocationDatum type
    .map((x) => ({
        // Once distance rows are removed, these will not be null 
        trafficId: x.traffic_id ?? '',
        direction: x.direction ?? 'src',
        ipAddr: x.ip_addr ?? '',
        latitude: x.latitude,
        longitude: x.longitude,
        error: x.error,
        countryCode: x.country_code,
      }),
    );

  if (locationRows !== undefined && locationRows.length > 0){
    geoIP = {
      geoLocation: locationRows,
      maxDist,
      maxError,
    }
  }

  return {
    type: 'reused-auth',
    name: 'Broken Authentication: Reused Authorization',
    severity: 'medium',
    occurredAt,
    detectedAt,
    data: {
      auth,
      inRequests,
      geoIP,
    },
  };
}

export type QueryFunction = () => Promise<ReusedAuthRow[]>;
export type GeoIPQueryFunction = (authRows: ReusedAuthRow[]) => Promise<GeoIPRow[]>;

/** runnerPure is the AnalysisFunction free of external dependencies
 *
 * This function allows for dependency injection during unit testing
 */
export async function runnerPure(
  reusedAuthQuery: QueryFunction,
  geoIPQuery?: GeoIPQueryFunction,
): Promise<Analysis> {
  const reusedAuthRows = await reusedAuthQuery();
  const geoIPRows = geoIPQuery && await geoIPQuery(reusedAuthRows);
  const reportedAt = new Date().toISOString();
  const findings = Object.entries(groupByAuthHeader(reusedAuthRows)).map(([id, reusedAuthRows]) =>
    rowsToFinding(reportedAt, id, reusedAuthRows, geoIPRows),
  );

  return {
    id: 'reused-auth',
    title: 'Broken Authentication: Reused Authorization',
    description:
      'Multiple clients were detected using the same Authorization HTTP ' +
      'header value. Clients who use the same authorization header could be ' +
      'evidence of stolen credentials. Make use of short-lived, per-device ' + 
      'credentials and ensure they are not shared across sessions, ' +
      'workloads, or devices.',
    severity: 'medium',
    reportedAt,
    findings,
    weaknessLink: 'https://owasp.org/API-Security/editions/2023/en/0xa2-broken-authentication/',
    weaknessTitle: '(OWASP) API2:2023 Broken Authentication',
  };
}

export async function reusedAuthentication(): Promise<Analysis[]> {
  const reusedAuthQueryFunction = async () => (await conn.query(reusedAuthQuery, [])).rows;
  const geoIPEnabled = (await conn.query(hasGeoIPDataQuery)).rows[0].on;
  const geoLocationEnabled = (await conn.query(hasGeoLocationDataQuery)).rows[0].on;
  const geoIPQueryFunction = geoIPEnabled && geoLocationEnabled ? 
    async (reusedAuthRows: ReusedAuthRow[]) => {
      // Get destination IPs to filter requests to check in query
      const allSecrets = reusedAuthRows.map(i => i.auth);
      return (await conn.query(geoIPQuery, [allSecrets])).rows;
    } 
    : undefined;
  return [await runnerPure(reusedAuthQueryFunction, geoIPQueryFunction)];
}
