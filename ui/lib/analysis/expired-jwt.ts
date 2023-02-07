import { Analysis, ExpiredJWT } from '../findings';
import conn from '../db';
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

function isExpired(jwt: string, occuredAt: number): string {
  var decoded = jwtDecode<JwtPayload>(jwt);

  // assumes jwt 'exp' follows NumericDate standard, epoch in seconds
  // https://www.rfc-editor.org/rfc/rfc7519#section-4.1.4
  // 300000ms=5m
  if (decoded.exp != undefined && occuredAt - decoded.exp * 1000 > 300000) {
    return new Date(decoded.exp * 1000).toISOString();
  }
  return '';
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

  const findings = rows.reduce(function (result, row) {
    const expirationDate = isExpired(row.jwt, row.timestamp);
    if (expirationDate) {
      const finding: ExpiredJWT = {
        type: 'expired-jwt',
        name: 'Expired JWTs',
        detectedAt,
        severity: 'low',
        occurredAt: {
          at: new Date(row.timestamp).toISOString(),
        },
        data: {
          jwt: row.jwt,
          expiredAt: expirationDate,
          inRequest: {
            at: new Date(row.timestamp).toISOString(),
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
    title: 'Expired JWTs',
    description:
      'A client is trying to authenticate with your API using an expired JWT token. While a correctly-configured ' +
      'server should reject these claims as unauthorized, this behavior could be a sign of: (1) a poorly behaving client that' +
      ' may have a bug or need to be updated with better token handling, or (2) a replay attack against your infrastructure. ' +
      'Ensure that your servers are validating and properly rejecting expired tokens, and that your clients are well-behaved ' +
      'and recycle their tokens at the necessary intervals.',
    reportedAt: new Date().toISOString(),
    severity: 'low',
    findings,
  };
}

export async function runner(): Promise<Analysis> {
  const queryFunction = async () => (await conn.query(query, [])).rows;

  return runnerPure(queryFunction);
}
