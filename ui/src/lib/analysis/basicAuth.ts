import { Analysis, UseOfBasicAuth } from "lib/findings";
import conn from "../../lib/db";

const query = `
SELECT DISTINCT
  data->'request'->'headers'->>'Authorization' as auth_header,
  data->'request'->>'absoluteURI' as absolute_uri,
  data->'src'->>'ip' as src_ip,
  data->'timestamp' as timestamp
FROM traffic WHERE
data->'request'->'headers'->>'Authorization' LIKE 'Basic*'
`;

interface Row {
    auth_header: string;
    absolute_uri: string;
    src_ip: string;
    timestamp: number;
  }

/** runnerPure is the AnalysisFunction free of external dependencies
 *
 * This function allows for dependency injection during unit testing
 */
export async function runnerPure(query: () => Promise<Row[]>): Promise<Analysis> {
  const rows = await query();
  const detectedAt = new Date().toISOString();
  const findings = rows.map((row)=>{
    const finding: UseOfBasicAuth = {
    type: "use-of-basic-auth",
    name: "Use of HTTP Basic Authentication",
    detectedAt,
    severity: "low",
    occurredAt: {
      at: (new Date(row.timestamp)).toISOString()
    },
    data: {
        inRequest: {
            at: (new Date(row.timestamp)).toISOString(),
            destIp: "",
            destPort: "",
            proto: "unknown", //Fill in
            srcIp: row.src_ip,
            srcPort: "",
            URI: "",
        }
    }
  };
  return finding;
});

  return {
    id: "reused-auth",
    title: "Reused Authentication",
    description: "",
    reportedAt: (new Date()).toISOString(),
    severity: "medium",
    findings,
  };
}

export async function useOfBasicAuth(): Promise<Analysis> {
  const queryFunction = async () => (await conn.query(query, [])).rows;

  return runnerPure(queryFunction);

}