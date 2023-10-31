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

import { Analysis, ExpiredJWT } from '../findings';
import { conn } from '../db';
import jwtDecode, { JwtPayload } from 'jwt-decode';

const query = `
SELECT
jsonb_array_elements((meta->>'DetectedJwts')::jsonb) AS jwt,
data->'request'->>'absoluteURI' AS absolute_uri,
data->'protocol'->>'name' AS proto,
data->'src'->>'ip' AS src_ip,
data->'src'->>'port' AS src_port,
location1.country_iso_code AS src_country_code,
ip1.latitude AS src_lat,
ip1.longitude AS src_long,
data->'dst'->>'ip' AS dest_ip,
data->'dst'->>'port' AS dest_port,
location2.country_iso_code AS dest_country_code,
ip2.latitude AS dest_lat,
ip2.longitude AS dest_long,
data->'timestamp' AS timestamp
FROM traffic
LEFT JOIN geo_ip_data ip1 ON ip1.network >>= (data->'src'->>'ip')::inet
LEFT JOIN geo_ip_data ip2 ON ip2.network >>= (data->'dst'->>'ip')::inet
LEFT JOIN geo_location_data location1 ON location1.geoname_id = ip1.geoname_id
LEFT JOIN geo_location_data location2 ON location2.geoname_id = ip2.geoname_id
WHERE meta->>'DetectedJwts' IS NOT NULL
`;

interface Row {
  jwt: string;
  absolute_uri: string;
  protocol: string;
  src_ip: string;
  src_country_code: string | null;
  src_lat: string | null;
  src_long: string | null;
  src_port: string;
  dest_ip: string;
  dest_country_code: string | null;
  dest_lat: string | null;
  dest_long: string | null;
  dest_port: string;
  timestamp: number;
}

function isExpired(jwt: string, occuredAt: number): string | undefined {
  var decoded = jwtDecode<JwtPayload>(jwt);

  if (!('exp' in decoded)) {
    return undefined;
  }

  if (!Number.isFinite(decoded.exp) || decoded.exp === undefined) {
    // TODO: raise error here? This is an included, but invalid, exp field
    return undefined;
  }

  // assumes jwt 'exp' follows NumericDate standard, epoch in seconds
  // https://www.rfc-editor.org/rfc/rfc7519#section-4.1.4
  // 300000ms=5m
  if (occuredAt - decoded.exp * 1000 > 300000) {
    return new Date(decoded.exp * 1000).toISOString();
  }
  return undefined;
}

/** runnerPure is the AnalysisFunction free of external dependencies
 *
 * This function allows for dependency injection during unit testing
 */
export async function runnerPure(
  query: () => Promise<Row[]>,
): Promise<Analysis> {
  const rows = await query();
  const detectedAt = new Date().toISOString();

  const findings = rows.reduce((result, row) => {
    const expirationDate = isExpired(row.jwt, row.timestamp);
    if (typeof expirationDate === 'string') {
      const at = new Date(row.timestamp).toISOString();
      const finding: ExpiredJWT = {
        type: 'expired-jwt',
        name: 'Broken Authentication: Expired JWTs',
        detectedAt,
        severity: 'low',
        occurredAt: { at },
        data: {
          jwt: row.jwt,
          expiredAt: expirationDate,
          inRequest: {
            at,
            destIp: row.dest_ip,
            destPort: row.dest_port,
            destCountryCode: row.dest_country_code ?? undefined,
            destLat: row.dest_lat ?? undefined,
            destLong: row.dest_long ?? undefined,
            proto:
              row.protocol === 'tcp'
                ? 'tcp'
                : row.protocol === 'udp'
                ? 'udp'
                : 'unknown',
            srcIp: row.src_ip,
            srcPort: row.src_port,
            srcCountryCode: row.src_country_code ?? undefined,
            srcLat: row.src_lat ?? undefined,
            srcLong: row.src_long ?? undefined,
            URI: row.absolute_uri,
          },
        },
      };
      result.push(finding);
    }
    return result;
  }, <ExpiredJWT[]>[]);

  return {
    id: 'expired-jwt',
    title: 'Broken Authentication: Expired JWTs',
    description:
      'A client is trying to authenticate with your API using an expired ' +
      'JWT. While a correctly-configured server should reject these claims ' +
      'as unauthorized, this behavior could be a sign of: (1) a poorly ' +
      'behaving client that may have a bug or need to be updated with better ' +
      'token handling, or (2) a replay attack against your infrastructure. ' +
      'Ensure that your servers validate the authenticity and expiration ' +
      'date of JWTs, as well as reject unsigned/weakly signed JWTs. Also ' +
      'ensure that your clients are well-behaved and refresh their tokens at ' +
      'the necessary intervals.',
    reportedAt: new Date().toISOString(),
    severity: 'low',
    findings,
    weaknessLink: 'https://owasp.org/API-Security/editions/2023/en/0xa2-broken-authentication/',
    weaknessTitle: '(OWASP) API2:2023 Broken Authentication',
  };
}

export async function expiredJwt(): Promise<Analysis[]> {
  const queryFunction = async () => (await conn.query(query, [])).rows;

  return [await runnerPure(queryFunction)];
}
