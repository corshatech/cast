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

import { Analysis, /* Finding */ } from "lib/findings";
import conn from "../../lib/db";

const query = `
SELECT DISTINCT
  data->'request'->'headers'->>'Authorization' as auth_header,
  data->'request'->>'absoluteURI' as absolute_uri,
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
  auth_header: string;
  absolute_uri: string;
  src_ip: string;
  timestamp: number;
}

/** group the rows by their auth header */
/*
  function groupByAuthHeader(rows: Row[]): Record<string, Row[]> {
  const groups: Record<string, Row[]> = {};

  rows.forEach((row: Row) => {
    groups[row.auth_header] = [...(groups[row.auth_header] ?? []), row];
  });

  return groups;
}

function rowsToFinding(detectedAt: string, id: string, rows: Row[]): Finding {
  const sortedRows = rows.sort((x, y) => x.timestamp - y.timestamp);
  const occurredAt = {
    start: new Date(sortedRows[0].timestamp).toISOString(),
    end: new Date(sortedRows[sortedRows.length - 1].timestamp).toISOString(),
  };
  return {
    type: "reused-auth",
    name: "Reused Authentication",
    severity: "medium",
    occurredAt,
    detectedAt,
    detail: {

    },
  };
}
*/

export type QueryFunction = () => Promise<Row[]>;

/** runnerPure is the AnalysisFunction free of external dependencies
 *
 * This function allows for dependency injection during unit testing
 */
export async function runnerPure(query: QueryFunction): Promise<Analysis> {
  await query();
  const reportedAt = new Date().toISOString();
  // const findings = Object.entries(groupByAuthHeader(rows)).map(([id, rows]) =>
  //   rowsToFinding(lastUpdated, id, rows),
  // );

  return {
    id: "reused-auth",
    title: "Reused Authentication",
    description: "",
    reportedAt,
    severity: "medium",
    findings: [],
  };
}

export async function runner(): Promise<Analysis> {
  const queryFunction = async () => (await conn.query(query, [])).rows;
  return runnerPure(queryFunction);
}
