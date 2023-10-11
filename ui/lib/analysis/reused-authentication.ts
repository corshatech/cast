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

const requestsQuery = `
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
),

-- Get max distances for each secret
max_distances AS (
  SELECT
    t1.auth AS auth,
    MAX(ST_DistanceSphere(
      ST_POINT(t1.longitude, t1.latitude),
      ST_POINT(t2.longitude, t2.latitude)
    ) / 1000) AS dist -- Distance in km
  FROM traffic_locations t1, traffic_locations t2
  WHERE t1.auth = t2.auth
  GROUP BY t1.auth
)

-- Find error for maxes and join with all traffic data
select * from traffic_locations
FULL JOIN(
	SELECT DISTINCT 
		traffic_distances.auth AS max_auth,
		max_distances.dist AS max_dist,
		max_error
	FROM (
		SELECT
			t1.auth AS auth,
			t1.error + t2.error AS max_error,
			ST_DistanceSphere(
				ST_POINT(t1.longitude, t1.latitude),
				ST_POINT(t2.longitude, t2.latitude)
			) / 1000 AS dist -- Distance in km
		FROM traffic_locations t1, traffic_locations t2
	) traffic_distances
	JOIN max_distances ON traffic_distances.dist = max_distances.dist and max_distances.auth = traffic_distances.auth
) max_data on false
`

interface ReusedAuthRow {
  auth: string;
  count: number;
  uri: string;
}

type RequestRow = {
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
} & {
  max_auth: string;
  max_dist: number;
  max_error: number;
}

function rowsToFinding(detectedAt: string, reusedAuthRow: ReusedAuthRow, requestRows: RequestRow[]): Finding {
  const { auth, uri, count } = reusedAuthRow;

  const maxRequest = requestRows.find(({
    max_auth,
    max_dist,
    max_error,
  }) => max_auth === auth && Number.isFinite(max_dist) && Number.isFinite(max_error))

  const maxDist = maxRequest?.max_dist;
  const maxError = maxRequest?.max_error;

  const requests = requestRows.flatMap((row) => {
    if(row.auth !== auth) {
      return []
    }

    // Map postgres rows to JSON compatible zod schema
    return [{
      trafficId: row.traffic_id,
      at: row.occurred_at,
      direction: row.direction,
      ipAddr: row.ip_addr,
      port: row.port,
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
      error: row.error ?? undefined,
      countryCode: row.country_code ?? undefined,
    }]
  })

  return {
    type: 'reused-auth',
    name: 'Broken Authentication: Reused Authorization',
    severity: 'medium',
    detectedAt,
    data: {
      auth,
      uri,
      count,
      maxDist,
      maxError,
      requests,
    },
  };
}

export type QueryFunction = () => Promise<ReusedAuthRow[]>;
export type RequestsQueryFunction = (authRows: ReusedAuthRow[]) => Promise<RequestRow[]>;

/** runnerPure is the AnalysisFunction free of external dependencies
 *
 * This function allows for dependency injection during unit testing
 */
export async function runnerPure(
  reusedAuthQuery: QueryFunction,
  requestsQuery: RequestsQueryFunction,
): Promise<Analysis> {
  const reusedAuthRows = await reusedAuthQuery();
  const requestRows = await requestsQuery(reusedAuthRows);
  const reportedAt = new Date().toISOString();
  const findings = reusedAuthRows.map((reusedAuthRow) =>
    rowsToFinding(reportedAt, reusedAuthRow, requestRows),
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
  const requestsQueryFunction = async (reusedAuthRows: ReusedAuthRow[]) => {
    // Get destination IPs to filter requests to check in query
    const allSecrets = reusedAuthRows.map(i => i.auth);
    return (await conn.query(requestsQuery, [allSecrets])).rows;
  } 
  return [await runnerPure(reusedAuthQueryFunction, requestsQueryFunction)];
}
