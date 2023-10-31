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

import { Analysis, RequestTooSlow } from '../findings';
import { conn } from '../db';

const ELAPSED_MEDIUM_SEVERITY_THRESHOLD = 60; // Minimum time (s) to generate medium severity finding
const ELAPSED_HIGH_SEVERITY_THRESHOLD = 180; // Minimum time (s) to generate high severity finding

const query = `
select
  elapsed_time,
  src_ip,
  src_country_code,
  src_lat,
  src_long,
  src_port,
  dest_ip,
  dest_country_code,
  dest_lat,
  dest_long,
  dest_port,
  protocol,
  timestamp,
  absolute_uri,
  method,
  version,
  mimeType,
  connection_header,
  accept_header
from
  (
    select
      cast (data->>'elapsedTime' as real)/1000 as elapsed_time,
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
      data->'protocol'->>'name' as protocol,
      data->'request'->>'absoluteURI' as absolute_uri,
      occurred_at as timestamp,
      data->'request'->>'method' as method,
      data->'request'->>'httpVersion' as version,
      data->'response'->'content'->>'mimeType' as mimeType,
      data->'request'->'headers'->>'Connection' as connection_header,
      data->'request'->'headers'->>'Accept' as accept_header
      from traffic
      LEFT JOIN geo_ip_data ip1 ON ip1.network >>= (data->'src'->>'ip')::inet
      LEFT JOIN geo_ip_data ip2 ON ip2.network >>= (data->'dst'->>'ip')::inet
      LEFT JOIN geo_location_data location1 ON location1.geoname_id = ip1.geoname_id
      LEFT JOIN geo_location_data location2 ON location2.geoname_id = ip2.geoname_id
  ) as trafficinner
where
  elapsed_time > ${ELAPSED_MEDIUM_SEVERITY_THRESHOLD}
  and method != 'CONNECT'
  and coalesce(connection_header, '') != 'Upgrade'
  and version = 'HTTP/1.1'
  and mimeType != 'text/event-stream'
  and not accept_header ~ 'text/event-stream'
`;

interface Row {
  elapsed_time: number;
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
  protocol: string;
  absolute_uri: string;
  timestamp: number;
}

/** runnerPure is the AnalysisFunction free of external dependencies
 *
 * This function allows for dependency injection during unit testing
 */
export async function runnerPure(
  query: () => Promise<Row[]>,
): Promise<Analysis> {
  const rows = await query();
  const detectedAt = new Date().toISOString();
  const maxTime = (rows ?? []).reduce((prev, curr) => Math.max(prev, curr.elapsed_time), 0);
  // Initially sort by request time descending
  rows.sort((r1, r2) => r2.elapsed_time - r1.elapsed_time)

  const findings = rows.map((row) => {
    const finding: RequestTooSlow = {
      type: 'request-too-slow',
      name: 'Request Too Slow',
      detectedAt,
      severity: row.elapsed_time > ELAPSED_HIGH_SEVERITY_THRESHOLD ? 'high' : 'medium',
      occurredAt: {
        at: new Date(row.timestamp).toISOString(),
      },
      data: {
        elapsedTime: row.elapsed_time,
        inRequest: {
          at: new Date(row.timestamp).toISOString(),
          proto:
          row.protocol === 'tcp'
          ? 'tcp'
          : row.protocol === 'udp'
          ? 'udp'
          : 'unknown',
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
    id: 'request-too-slow',
    title: 'Request Too Slow',
    description:
      'A request was detected that was in-flight for longer than one minute. ' +
      'An API can be vulnerable to DoS and resource exhaustion attacks, ' +
      'which can use up the allocated resources and potentially cause outages. ' +
      'Ensure that you have implemented resource limits as well as timeouts for ' +
      'requests to your APIs.',
    reportedAt: new Date().toISOString(),
    severity: maxTime >= ELAPSED_HIGH_SEVERITY_THRESHOLD ? 'high' : 'medium',
    findings,
    weaknessLink: 'https://owasp.org/API-Security/editions/2023/en/0xaa-unsafe-consumption-of-apis/',
    weaknessTitle: '(OWASP) API10:2023 Unsafe Consumption of APIs',
  };
}

export async function requestTooSlow(): Promise<Analysis[]> {
  const queryFunction = async () => (await conn.query(query, [])).rows;

  return [await runnerPure(queryFunction)];
}
