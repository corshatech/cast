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

import { Analysis, Finding, GeoDist, LocationDatum, ReusedAuthentication } from '../../lib/findings';
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
-- Map traffic data in traffic table to Maxmind geographic data using IP

WITH geo_traffic AS
	(
    -- Join matview/geo-ip data with geo-location data
    SELECT 
      id,
      dst,
			src,
			src_lat,
			src_long,
			country_iso_code,
			error
		FROM
			(
        -- Join matview traffic data with maxmind geo-ip data
        SELECT matview_traffic.traffic_id AS id,
					matview_traffic.dst AS dst,
					matview_traffic.src AS src,
					latitude AS src_lat,
					longitude AS src_long,
					geo_ip_data.accuracy_radius AS error,
					geoname_id
				FROM geo_ip_data
				JOIN
					(
            -- Join source and destination traffic into same row
            SELECT m2.traffic_id AS traffic_id,
							m1.ip_addr::INET AS dst,
							m2.ip_addr::INET AS src
						FROM
							(
                -- Only get destination entries from traffic matview
                SELECT *
								FROM matview_traffic_ips
								WHERE direction = 'dst' 
              ) m1
						JOIN
              (
                -- Get source entries from matview that are not local IPs
                SELECT *
								FROM matview_traffic_ips
								WHERE direction = 'src'
									AND NOT ip_addr::INET <<= '10.0.0.0/8'::INET
									AND NOT ip_addr::INET <<= '172.16.0.0/12'::INET
									AND NOT ip_addr::INET <<= '192.168.0.0/16'::INET 
              ) m2 ON m1.traffic_id = m2.traffic_id
          ) matview_traffic ON matview_traffic.src <<= geo_ip_data.network
				WHERE latitude IS NOT NULL
					AND longitude IS NOT NULL 
      ) trafficinner
    JOIN geo_location_data ON trafficinner.geoname_id = geo_location_data.geoname_id
  ),

traffic_distances as
	(
    -- Self join and find distances between points
    -- Select distinct with "CASE" to prevent duplicate distances being found
    SELECT 
    DISTINCT 
    g1.dst AS dst,
    LEAST(g1.src, g2.src) AS src1_ip,
    CASE WHEN g1.src < g2.src THEN g1.id ELSE g2.id END AS src1_traffic_id,
    CASE WHEN g1.src < g2.src THEN g1.src_lat ELSE g2.src_lat END AS src1_lat,
    CASE WHEN g1.src < g2.src THEN g1.src_long ELSE g2.src_long END AS src1_long,
    CASE WHEN g1.src < g2.src THEN g1.country_iso_code ELSE g2.country_iso_code END AS src1_country,
    CASE WHEN g1.src < g2.src THEN g1.error ELSE g2.error END AS src1_error,
    GREATEST(g1.src, g2.src) AS src2_ip,
    CASE WHEN g1.src > g2.src THEN g1.id ELSE g2.id END AS src2_traffic_id,
    CASE WHEN g1.src > g2.src THEN g1.src_lat ELSE g2.src_lat END AS src2_lat,
    CASE WHEN g1.src > g2.src THEN g1.src_long ELSE g2.src_long END AS src2_long,
    CASE WHEN g1.src > g2.src THEN g1.country_iso_code ELSE g2.country_iso_code END AS src2_country,
    CASE WHEN g1.src > g2.src THEN g1.error ELSE g2.error END AS src2_error,
    st_distancesphere(
      st_point(g1.src_long, g1.src_lat),
      st_point(g2.src_long, g2.src_lat)
    ) / 1000 AS dist -- Distance in km
    FROM geo_traffic g1, geo_traffic g2
    WHERE g1.src != g2.src
  )
SELECT * FROM traffic_distances
WHERE dist != 0 AND dst = ANY($1)
ORDER BY dist DESC
`;

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
  dst: string;
  src1_traffic_id: string;
  src1_ip: string;
  src1_lat: string;
  src1_long: string;
  src1_country: string;
  src1_error: number;
  src2_traffic_id: string;
  src2_ip: string;
  src2_lat: string;
  src2_long: string;
  src2_country: string;
  src2_error: number;
  dist: number;
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

  const inRequestsTrafficIDs = inRequests.map((x) => x.id);

  let geoIP: ReusedAuthentication['data']['geoIP'] = undefined;

  if (geoIPRows !== undefined){
    let geoLocation: LocationDatum[] = geoIPRows?.flatMap(
      (x) => [{
        id: x.src1_traffic_id,
        dst: x.dst,
        src: x.src1_ip,
        lat: x.src1_lat,
        long: x.src1_long,
        country: x.src1_country,
        error: x.src1_error,
      }, {
        id: x.src2_traffic_id,
        dst: x.dst,
        src: x.src2_ip,
        lat: x.src2_lat,
        long: x.src2_long,
        country: x.src2_country,
        error: x.src2_error,
      }],
    );

    // Remove duplicate ips (matched with other ips multiple times to check distances)
    // Remove traffic that is not included in the current reused auth finding
    geoLocation = geoLocation.filter((value, index, self) => 
      index === self.findIndex((location) => (
        location.src === value.src && inRequestsTrafficIDs.includes(location.id)
      )),
    )

    // Find row with the maximum and pull out error in each point to add as final error
    const { src1_error, src2_error, ...maxDistRow }: GeoIPRow = 
      geoIPRows?.reduce(
        (i, j) => i.dist > j.dist ? i : j,
      )

    const maxDist: GeoDist = {
      ...maxDistRow,
      error: src1_error + src2_error,
    }

    geoIP = geoLocation.length > 0 ?
      {
        geoLocation,
        maxDist,
      }
      : geoIP = undefined
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
      const dstIPs = reusedAuthRows.map(i => i.dst_ip);
      return (await conn.query(geoIPQuery, [dstIPs])).rows;
    } 
    : undefined;
  return [await runnerPure(reusedAuthQueryFunction, geoIPQueryFunction)];
}
