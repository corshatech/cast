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

import { Analysis, Finding, ReusedAuthentication } from '../../libs/findings';
import conn from '../../libs/db';

const query = `
select
  reused.auth,
  srcCount.count,
  authTimespan.min_timestamp,
  authTimespan.max_timestamp,
  sampleRequest.src->>'ip' as src_ip,
  sampleRequest.src->>'port' as src_port,
  sampleRequest.dst->>'ip' as dst_ip,
  sampleRequest.dst->>'port' as dst_port,
  sampleRequest.uri,
  sampleRequest.timestamp
FROM

-- find all auth headers that have multiple sources
(
SELECT
  data->'request'->'headers'->>'Authorization' as auth
FROM traffic
WHERE
  data->'request'->'headers'->>'Authorization' is not null
GROUP BY
  auth
HAVING
  count(distinct data->'src'->'ip') > 1
) as reused,

-- find min and max timestamps for each reused auth header
LATERAL (
SELECT
  min(t.occurred_at) as min_timestamp,
  max(t.occurred_at) as max_timestamp
FROM traffic as t
WHERE reused.auth = t.data->'request'->'headers'->>'Authorization'
GROUP BY reused.auth
) as authTimespan,

-- find the request counts for each source that reused the auth header
LATERAL (
  SELECT
    t.data->'src'->'ip' as src_ip,
    reused.auth as auth,
    count(*) as count
  FROM traffic AS t
  WHERE reused.auth = t.data->'request'->'headers'->>'Authorization'
  GROUP BY t.data->'src'->'ip', reused.auth
) as srcCount,

-- find the most recent request made by each source that reused the auth header
LATERAL (
  SELECT
  t.data->'src' as src,
  t.data->'dst' as dst,
  t.data->'request'->'absoluteURI' as uri,
  t.occurred_at as timestamp
  FROM traffic t
  WHERE
    srcCount.src_ip = t.data->'src'->'ip'
  AND
    srcCount.auth = t.data->'request'->'headers'->>'Authorization'
  ORDER BY t.occurred_at DESC
  LIMIT 1
) as sampleRequest
`;

interface Row {
  auth: string;
  count: number;
  min_timestamp: Date;
  max_timestamp: Date;
  src_ip: string;
  src_port: string;
  dst_ip: string;
  dst_port: string;
  uri: string;
  timestamp: Date;
}

/** group the rows by their auth header */
function groupByAuthHeader(rows: Row[]): Record<string, Row[]> {
  const groups: Record<string, Row[]> = {};

  rows.forEach((row: Row) => {
    groups[row.auth] = [...(groups[row.auth] ?? []), row];
  });

  return groups;
}

function rowsToFinding(detectedAt: string, auth: string, rows: Row[]): Finding {
  const occurredAt = {
    start: rows[0].min_timestamp.toISOString(),
    end: rows[0].max_timestamp.toISOString(),
  };
  const inRequests: ReusedAuthentication['data']['inRequests'] = rows.map(
    (x) => ({
      srcIp: x.src_ip,
      srcPort: x.src_port,
      proto: 'tcp',
      destIp: x.dst_ip,
      destPort: x.dst_port,
      URI: x.uri,
      at: x.timestamp.toISOString(),
      count: x.count,
    }),
  );

  return {
    type: 'reused-auth',
    name: 'Reused Authentication',
    severity: 'medium',
    occurredAt,
    detectedAt,
    data: {
      auth,
      inRequests,
    },
  };
}

export type QueryFunction = () => Promise<Row[]>;

/** runnerPure is the AnalysisFunction free of external dependencies
 *
 * This function allows for dependency injection during unit testing
 */
export async function runnerPure(query: QueryFunction): Promise<Analysis> {
  const rows = await query();
  const reportedAt = new Date().toISOString();
  const findings = Object.entries(groupByAuthHeader(rows)).map(([id, rows]) =>
    rowsToFinding(reportedAt, id, rows),
  );

  return {
    id: 'reused-auth',
    title: 'Reused Authentication',
    description:
      'An analysis that finds if multiple clients are using the same Authorization HTTP header value. Clients who use the same authorization header could be evidence of stolen credentials.',
    severity: 'medium',
    reportedAt,
    findings,
  };
}

export async function runner(): Promise<Analysis> {
  const queryFunction = async () => (await conn.query(query, [])).rows;
  return runnerPure(queryFunction);
}
