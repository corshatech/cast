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
  jsonb_array_elements((meta->>'DetectedJwts')::jsonb) as jwt,
  data->'request'->>'absoluteURI' as absolute_uri,
  data->'protocol'->>'name' as proto,
  data->'src'->>'ip' as src_ip,
  data->'src'->>'port' as src_port,
  data->'dst'->>'ip' as destination_ip,
  data->'dst'->>'port' as destination_port,
  data->'timestamp' as timestamp
  FROM traffic WHERE
  meta->>'DetectedJwts' is not null;
`;

interface Row {
  jwt: string;
  absolute_uri: string;
  protocol: string;
  src_ip: string;
  src_port: string;
  destination_ip: string;
  destination_port: string;
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
            destIp: row.destination_ip,
            destPort: row.destination_port,
            proto:
              row.protocol === 'tcp'
                ? 'tcp'
                : row.protocol === 'udp'
                ? 'udp'
                : 'unknown',
            srcIp: row.src_ip,
            srcPort: row.src_port,
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
