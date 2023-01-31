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
SELECT
id,
  data->'src'->>'ip' as src_ip,
  data->'src'->>'port' as src_port,
  data->'dst'->>'ip' as dst_ip,
  data->'dst'->>'port' as dst_port,
  data->'request'->'absoluteURI' as uri,
  occurred_at as timestamp,
  array_agg(pass_in_url.field) as query_params
FROM traffic INNER JOIN pass_in_url ON traffic.id = pass_in_url.traffic_id
GROUP BY id, uri, src_ip, timestamp
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
    type: "pass-in-url",
    name: "Password in Query String",
    severity: "high",
    occurredAt,
    detectedAt,
    data: {
      queryParams: row.query_params,
      inRequest: {
        srcIp: row.src_ip,
        srcPort: row.src_port,
        proto: "tcp",
        destIp: row.dst_ip,
        destPort: row.dst_port,
        URI: row.uri,
        at,
      },
    }
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
    id: "pass-in-url",
    title: "Password in Query String",
    description: "Potential password in query string",
    reportedAt,
    severity: "high",
    findings,
  };
}

export async function runner(): Promise<Analysis> {
  const queryFunction = async () => (await conn.query(query, [])).rows;
  return runnerPure(queryFunction);
}
