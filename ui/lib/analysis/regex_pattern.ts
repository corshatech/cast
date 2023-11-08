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

import { Analysis, AnalysisOf, RegexFinding, RegexPattern } from 'lib/findings';
import { conn } from '../../lib/db';
import { z } from 'zod';

const query = `
SELECT
  data->'src'->>'ip' AS src_ip,
  data->'src'->>'port' AS src_port,
  data->'dst'->>'ip' AS dst_ip,
  data->'dst'->>'port' AS dst_port,
  data->'request'->'absoluteURI' AS uri,
  occurred_at AS timestamp,
  meta->'PatternFindings' AS findings
FROM traffic
WHERE meta ? 'PatternFindings'
`;

const Row = z.object({
  src_ip: z.string(),
  src_port: z.string(),
  dst_ip: z.string(),
  dst_port: z.string(),
  uri: z.string(),
  timestamp: z.date(),
  findings: z.array(RegexPattern),
});

export type Row = z.infer<typeof Row>;

function rowToFinding(detectedAt: string, row: Row): RegexFinding[] {
  const at = new Date(row.timestamp).toISOString();
  const occurredAt = { at };
  return row.findings.map((finding) => ({
    type: 'regex-pattern',
    name: finding.Rule.title,
    severity: finding.Rule.severity,
    occurredAt,
    detectedAt,
    data: {
      description: finding.Rule.description,
      weaknessLink: finding.Rule.weaknessLink ?? '',
      weaknessTitle: finding.Rule.weaknessTitle ?? '',
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
  }));
}

export type QueryFunction = () => Promise<Row[]>;

/** runnerPure is the AnalysisFunction free of external dependencies
 *
 * This function allows for dependency injection during unit testing
 */
export async function runnerPure(query: QueryFunction): Promise<Analysis[]> {
  const rows = z.array(Row).parse(await query());
  const reportedAt = new Date().toISOString();
  const findings: RegexFinding[] = rows.flatMap(row => rowToFinding(reportedAt, row));


  let groupedAnalyses = new Map<string, AnalysisOf<RegexFinding>>();
  findings.forEach((finding) => {
    let analysis = groupedAnalyses.get(finding.name) ?? {
        id: 'regex-pattern',
        title: finding.name,
        description: finding.data.description,
        reportedAt,
        weaknessLink: finding.data.weaknessLink,
        weaknessTitle: finding.data.weaknessTitle,
        severity: finding.severity,
        findings: [],
      };
    analysis.findings.push(finding);
    groupedAnalyses.set(finding.name, analysis)
  })

  return [...groupedAnalyses.values()];
}

export async function regexPattern(): Promise<Analysis[]> {
  const queryFunction = async () => (await conn.query(query, [])).rows;
  return await runnerPure(queryFunction);
}
