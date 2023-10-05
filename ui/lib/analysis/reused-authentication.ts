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
SELECT
  reused.auth,
  srcCount.count,
  sampleRequest.uri
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

-- find the request counts for each source that reused the auth header
LATERAL (
  SELECT
    reused.auth AS auth,
    count(*) AS count
  FROM traffic AS t
  WHERE reused.auth = t.data->'request'->'headers'->>'Authorization'
  GROUP BY reused.auth
) AS srcCount,

-- find the most recent request made by each source that reused the auth header
LATERAL (
  SELECT
  t.id AS id,
  t.data->'src' AS src,
  t.data->'dst' AS dst,
  t.data->'request'->'absoluteURI' AS uri
  FROM traffic t
  WHERE
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
    uri,
    port,
    latitude,
    longitude,
    occurred_at,
	  accuracy_radius AS error,
    country_iso_code AS country_code
	FROM matview_traffic_ips 
	LEFT JOIN (
		SELECT
      id,
      occurred_at,
      data->'request'->>'absoluteURI' as uri,
      data->'src'->>'port' as port,
      data->'request'->'headers'->>'Authorization' AS auth
		FROM traffic 
		WHERE data->'request'->'headers'->>'Authorization' = ANY($1)
	) trafficdata ON trafficdata.id = matview_traffic_ips.traffic_id
	LEFT JOIN geo_ip_data ON geo_ip_data.network >>= ip_addr::inet
	LEFT JOIN geo_location_data ON geo_location_data.geoname_id = geo_ip_data.geoname_id
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
  uri: string;
}

interface GeoIPRow {
  auth: string;
  traffic_id: string;
  direction: 'src' | 'dst';
  ip_addr: string;
  uri: string;
  port: string;
  occurred_at: string;
  latitude: string | null;
  longitude: string | null;
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

  // All rows for current finding should have the same secret
  const correlatedSecret = reusedAuthRows[0].auth

  const inRequests: ReusedAuthentication['data']['inRequests'] = reusedAuthRows.map(
    (x) => ({
      URI: x.uri,
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
      return row.max_dist === null && row.max_error == null && row.auth === correlatedSecret
    })

    // Map all rows to LocationDatum type
    .map((x) => ({
        occurredAt: x.occurred_at,
        trafficId: x.traffic_id,
        direction: x.direction,
        ipAddr: x.ip_addr,
        uri: x.uri,
        port: x.port,
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
    // occurredAt,
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
  const geoIPEnabled = (await conn.query(hasGeoIPDataQuery)).rows[0].on;
  const geoLocationEnabled = (await conn.query(hasGeoLocationDataQuery)).rows[0].on;
  const reusedAuthQueryFunction = async () => (await conn.query(reusedAuthQuery, [])).rows;
  const geoIPQueryFunction = geoIPEnabled && geoLocationEnabled ? 
    async (reusedAuthRows: ReusedAuthRow[]) => {
      // Get destination IPs to filter requests to check in query
      const allSecrets = reusedAuthRows.map(i => i.auth);
      return (await conn.query(geoIPQuery, [allSecrets])).rows;
    } 
    : undefined;
  return [await runnerPure(reusedAuthQueryFunction, geoIPQueryFunction)];
}
