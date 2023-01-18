/* Copyright 2022 Corsha.
   Licensed under the Apache License, Version 2.0 (the 'License');
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
   http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an 'AS IS' BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License. */

import { Analysis, Finding } from "lib/findings";
import conn from "../../lib/db";

export type AuthenticationUseRecord = {
  absoluteUri: string;
  srcIp: string;
};

export type AnalysisResponse = {
  groups: Record<string, AuthenticationUseRecord[]>;
};

const query = `
SELECT DISTINCT
  data->'request'->'headers'->>'Authorization' as auth_header,
  data->'request'->>'absoluteUri' as absolute_uri,
  data->'src'->>'ip' as src_ip,
  data->'timestamp' as timestamp
FROM traffic WHERE
data->'request'->'headers'->>'Authorization' IN (
  SELECT
    data->'request'->'headers'->>'Authorization' as auth_header
  FROM traffic
  WHERE data->'request'->'headers'->>'Authorization' is not null
  GROUP BY auth_header
  HAVING count(distinct data->'src'->>'ip') > 1
)
`;

interface Row {
  auth_header: string,
  absolute_uri: string,
  src_ip: string,
  timestamp: number,
}

/** group the rows by their auth header */
function groupByAuthHeader(rows: Row[]): Record<string, Row[]> {
  const groups: Record<string, Row[]> = {};

  rows.forEach((row: Row) => {
    groups[row.auth_header] = [
      ...(groups[row.auth_header] ?? []), row
    ];
  });

  return groups;
}

function rowToMarkdownTableRow(row: Row): string {
  const date = new Date(row.timestamp).toISOString();
  return `| ${date} | ${row.absolute_uri} | ${row.src_ip} |`;
}

function rowsToFinding(detectedAt: string, id: string, rows: Row[]): Finding {
  const sortedRows = rows.sort((x, y) => x.timestamp - y.timestamp);
  const occurredAt = {
    start: new Date(sortedRows[0].timestamp).toISOString(),
    end: new Date(sortedRows[sortedRows.length - 1].timestamp).toISOString(),
  };
  const markdownLines = sortedRows.map(rowToMarkdownTableRow).join("\n");
  const detail = `
| Timestamp | Absolute URI | Source IP |
| --- | --- | --- |
${markdownLines}
`;

  return {
    id: id,
    type: "reused-authentication",
    description: "",
    occurredAt: occurredAt,
    detectedAt: detectedAt,
    severity: "medium",
    detail: detail,
  };
}

export type QueryFunction = () => Promise<Row[]>;
export type NowFunction = () => string;

/** runnerPure is the AnalysisFunction free of external dependencies
*
* This function allows for dependency injection during unit testing
*/
export async function runnerPure(now: NowFunction, query: QueryFunction): Promise<Analysis> {
  const lastUpdated = now();
  const findings = Object.entries(groupByAuthHeader(await query()))
    .map(([id, rows]) => rowsToFinding(lastUpdated, id, rows));

  return {
    id: "reused-authentication",
    name: "Reused Authentication",
    description: "",
    priority: 1,
    lastUpdated: lastUpdated,
    findings: findings,
  };
}

export async function runner(): Promise<Analysis> {
  const now = () => new Date().toISOString();
  const queryFunction = async () => (await conn.query(query, [])).rows;
  return runnerPure(now, queryFunction);
}
