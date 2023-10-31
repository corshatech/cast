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

import { Analysis, UseOfBasicAuth } from '../findings';
import { conn } from '../db';

const query = `
SELECT
  data->'request'->'headers'->>'Authorization' as auth_header,
  data->'request'->>'absoluteURI' as absolute_uri,
  data->'protocol'->>'name' as proto,
  data->'src'->>'ip' as src_ip,
  data->'src'->>'port' as src_port,
  location1.country_iso_code AS src_country_code,
  ip1.latitude AS src_lat,
  ip1.longitude AS src_long,
  data->'dst'->>'ip' as dest_ip,
  data->'dst'->>'port' as dest_port,
  location2.country_iso_code AS dest_country_code,
  ip2.latitude AS dest_lat,
  ip2.longitude AS dest_long,
  data->'timestamp' as timestamp
FROM traffic
LEFT JOIN geo_ip_data ip1 ON ip1.network >>= (data->'src'->>'ip')::inet
LEFT JOIN geo_ip_data ip2 ON ip2.network >>= (data->'dst'->>'ip')::inet
LEFT JOIN geo_location_data location1 ON location1.geoname_id = ip1.geoname_id
LEFT JOIN geo_location_data location2 ON location2.geoname_id = ip2.geoname_id
WHERE meta->>'UseOfBasicAuth' = 'true'
`;

interface Row {
    auth_header: string;
    absolute_uri: string;
    protocol: string;
    src_ip: string;
    src_country_code: string | null;
    src_lat: string;
    src_long: string;
    src_port: string;
    dest_ip: string;
    dest_country_code: string | null;
    dest_lat: string;
    dest_long: string;
    dest_port: string;
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
    type: 'use-of-basic-auth',
    name: 'Use of HTTP Basic Authentication',
    detectedAt,
    severity: 'low',
    occurredAt: {
      at: (new Date(row.timestamp)).toISOString(),
    },
    data: {
        inRequest: {
            at: (new Date(row.timestamp)).toISOString(),
            proto: (row.protocol === 'tcp') ? 'tcp' : (row.protocol === 'udp') ? 'udp' : 'unknown',
            srcIp: row.src_ip,
            srcCountryCode: row.src_country_code ?? undefined,
            srcLat: row.src_lat ?? undefined,
            srcLong: row.src_long ?? undefined,
            srcPort: row.src_port,
            destIp: row.dest_ip,
            destCountryCode: row.dest_country_code ?? undefined,
            destLat: row.dest_lat ?? undefined,
            destLong: row.dest_long ?? undefined,
            destPort: row.dest_port,
            URI: row.absolute_uri,
        },
      },
    };
    return finding;
  });

  return {
    id: 'use-of-basic-auth',
    title: 'Use of HTTP Basic Authentication',
    description: 'HTTP Basic Auth is insecure if used over plain HTTP. ' +
    'Ensure that all uses of Basic Auth are configured to only occur over TLS. ' +
    'Consider using another, more secure kind of authentication if possible, such as tokens.',
    reportedAt: (new Date()).toISOString(),
    severity: 'medium',
    findings,
  };
}

export async function useOfBasicAuth(): Promise<Analysis[]> {
  const queryFunction = async () => (await conn.query(query, [])).rows;

  return [await runnerPure(queryFunction)];
}
