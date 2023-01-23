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
  data->'request'->>'absoluteURI' as absolute_uri,
  data->'src'->>'ip' as src_ip,
  data->'timestamp' as timestamp,
  array_agg(urlpassword.field) as password_fields
FROM traffic INNER JOIN urlpassword ON traffic.id = urlpassword.traffic_id
GROUP BY id, absolute_uri, src_ip, timestamp
`;

interface Row {
  id: string;
  absolute_uri: string;
  src_ip: string;
  timestamp: number;
  password_fields: string[];
}

function rowToFinding(detectedAt: string, row: Row): Finding {
  const occurredAt = {
    at: new Date(row.timestamp).toISOString(),
  };
  const fieldsList = row.password_fields.map((x) => `  - ${x}`).join("\n");
  const detail = `
- Absolute URI: ${row.absolute_uri}
- Source IP: ${row.src_ip}
- Password URL Parameter:
${fieldsList}
`;


  return {
    id: row.id,
    type: "urlpassword",
    name: "Password in Query String",
    description: `Potential password in query string for ${row.absolute_uri}`,
    occurredAt: occurredAt,
    detectedAt: detectedAt,
    severity: "high",
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
  const findings = (await query()).map(row => rowToFinding(lastUpdated, row));

  return {
    id: "urlpassword",
    name: "Password in Query String",
    description: "Potential password in query string",
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
