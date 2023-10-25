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

import { Analysis, Finding, RegexFinding, RegexPattern } from 'lib/findings';
import { conn } from '../../lib/db';
import { z } from 'zod';

export type AuthenticationUseRecord = {
  absoluteUri: string;
  srcIp: string;
};

export type AnalysisResponse = {
  groups: Record<string, AuthenticationUseRecord[]>;
};

const query = `
SELECT
	src_ip,
	src_port,
	dst_ip,
	dst_port,
  timestamp,
  finding
FROM (
  SELECT
	data->'src'->>'ip' AS src_ip,
  data->'src'->>'port' AS src_port,
  data->'dst'->>'ip' AS dst_ip,
  data->'dst'->>'port' AS dst_port,
  occurred_at as timestamp,
	jsonb_array_elements(meta->'PatternFindings') AS finding
  FROM traffic
) trafficinner (src_ip, src_port, dst_ip, dst_port, timestamp, finding)
WHERE finding->>'Id' = $1
ORDER BY timestamp DESC
`;

const Row = z.object({
  src_ip: z.string(),
  src_port: z.string(),
  dst_ip: z.string(),
  dst_port: z.string(),
  timestamp: z.number().int(),
  finding: RegexFinding,
})

export type Row = z.infer<typeof Row>;

function rowToFinding(detectedAt: string, row: Row, regexName: string): Finding {
  const at = new Date(row.timestamp).toISOString();
  const occurredAt = { at };
  return {
    type: 'regex-pattern',
    name: row.finding.Rule.title,
    severity: row.finding.Rule.severity,
    description: row.finding.Rule.description,
    occurredAt,
    detectedAt,
    data: {
      regexName,
      queryParams: row.finding.QueryParams,
      weaknessLink: row.finding.Rule.weaknessLink ?? '',
      weaknessTitle: row.finding.Rule.weaknessTitle ?? '',
      inRequest: {
        srcIp: row.src_ip,
        srcPort: row.src_port,
        proto: 'tcp',
        destIp: row.dst_ip,
        destPort: row.dst_port,
        URI: row.finding.AbsoluteUri,
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
export async function runnerPure(query: QueryFunction, regexName: string): Promise<Analysis> {
  const rows = await query();
  const reportedAt = new Date().toISOString();
  const findings = rows.map(row => rowToFinding(reportedAt, row, regexName));

  // Get first finding, all findings will be the same type and contain a description
  const finding = findings[0] as RegexPattern;
  finding.description = finding.description ?? '';

  return {
    id: 'regex-pattern',
    title: finding.name,
    description: finding.description,
    reportedAt,
    weaknessLink: finding.data.weaknessLink,
    weaknessTitle: finding.data.weaknessTitle,
    severity: finding.severity,
    findings,
  };
}

export async function regexPattern(regexName: string): Promise<Analysis[]> {
  const queryFunction = async () => (await conn.query(query, [regexName])).rows;
  return [await runnerPure(queryFunction, regexName)];
}
