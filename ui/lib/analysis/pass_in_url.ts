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

import { Analysis, Finding } from 'lib/findings';
import { conn } from '../../lib/db';

export type AuthenticationUseRecord = {
  absoluteUri: string;
  srcIp: string;
};

export type AnalysisResponse = {
  groups: Record<string, AuthenticationUseRecord[]>;
};

const query = `
SELECT
id,
  data->'src'->>'ip' as src_ip,
  data->'src'->>'port' as src_port,
  data->'dst'->>'ip' as dst_ip,
  data->'dst'->>'port' as dst_port,
  meta->'PassInUrl'->'AbsoluteUri' as uri,
  occurred_at as timestamp,
  meta->'PassInUrl'->'QueryParams' as query_params
FROM traffic
WHERE meta ? 'PassInUrl'
ORDER BY occurred_at DESC
`;

interface Row {
  src_ip: string;
  src_port: string;
  dst_ip: string;
  dst_port: string;
  uri: string;
  timestamp: Date;
  query_params: string[];
}

function rowToFinding(detectedAt: string, row: Row): Finding {
  const at = row.timestamp.toISOString();
  const occurredAt = { at };
  return {
    type: 'pass-in-url',
    name: 'Broken Authentication: Password in Query String',
    severity: 'high',
    occurredAt,
    detectedAt,
    data: {
      queryParams: row.query_params,
      inRequest: {
        srcIp: row.src_ip,
        srcPort: row.src_port,
        proto: 'tcp',
        destIp: row.dst_ip,
        destPort: row.dst_port,
        URI: row.uri,
        at,
      },
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
  const findings = rows.map(row => rowToFinding(reportedAt, row));

  return {
    id: 'pass-in-url',
    title: 'Broken Authentication: Password in Query String',
    description:
      'Sensitive authentication details, such as auth tokens and passwords, ' +
      'were detected in a URL as a query parameter. Using secure transport ' +
      'like HTTPS does not resolve the issue, because the URL may become ' +
      'logged or leak to third parties, such as advertisers or your CDN, ' +
      'through e.g. the Referrer header. Never include credentials in any ' +
      'part of a URL.',
    reportedAt,
    weaknessLink: 'https://owasp.org/API-Security/editions/2023/en/0xa2-broken-authentication/',
    weaknessTitle: '(OWASP) API2:2023 Broken Authentication',
    severity: 'high',
    findings,
  };
}

export async function passInUrl(): Promise<Analysis[]> {
  const queryFunction = async () => (await conn.query(query, [])).rows;
  return [await runnerPure(queryFunction)];
}
