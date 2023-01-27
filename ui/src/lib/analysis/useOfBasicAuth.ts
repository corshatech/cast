import { Analysis, UseOfBasicAuth } from "lib/findings";
import conn from "../db";

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
    description: "HTTP Basic Auth is insecure if used over plain HTTP. " + 
    "Ensure that all uses of Basic Auth are configured to only occur over TLS. " + 
    "Consider using another, more secure kind of authentication if possible, such as tokens.",
    reportedAt: (new Date()).toISOString(),
    severity: "medium",
    findings,
  };
}

export async function useOfBasicAuth(): Promise<Analysis> {
  const queryFunction = async () => (await conn.query(query, [])).rows;

  return runnerPure(queryFunction);

}