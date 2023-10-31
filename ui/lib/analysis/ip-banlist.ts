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

import { z } from 'zod';

import { Analysis, AnalysisOf, IpBanlist as BanlistFinding } from '../findings';
import { conn } from '../db';
import { logger } from '../internal';

const query = `
SELECT
DISTINCT ON (traffic.id) traffic_id,
  view.ip_addr as specific_address,
  banlist.country as country,
  banlist.malware as malware,
  traffic.data->'request'->>'absoluteURI' as absolute_uri,
  traffic.data->'protocol'->>'name' as proto,
  traffic.data->'src'->>'ip' as src_ip,
  traffic.data->'src'->>'port' as src_port,
  location1.country_iso_code AS src_country_code,
  ip1.latitude AS src_lat,
  ip1.longitude AS src_long,
  traffic.data->'dst'->>'ip' as dest_ip,
  traffic.data->'dst'->>'port' as dest_port,
  location2.country_iso_code AS dest_country_code,
  ip2.latitude AS dest_lat,
  ip2.longitude AS dest_long,
  traffic.data->'timestamp' as timestamp
FROM matview_traffic_ips as view
INNER JOIN feodo_banlist as banlist ON view.ip_addr = banlist.ip_address
INNER JOIN traffic ON view.traffic_id = traffic.id
LEFT JOIN geo_ip_data ip1 ON ip1.network >>= (data->'src'->>'ip')::inet
LEFT JOIN geo_ip_data ip2 ON ip2.network >>= (data->'dst'->>'ip')::inet
LEFT JOIN geo_location_data location1 ON location1.geoname_id = ip1.geoname_id
LEFT JOIN geo_location_data location2 ON location2.geoname_id = ip2.geoname_id
ORDER BY traffic.id, view.ip_addr DESC NULLS LAST
`;

export const Row = z.object({
  specific_address: z.string().ip(),
  country: z.string().nullable(),
  malware: z.string().nullable(),
  absolute_uri: z.string().nullable(),
  proto: z.string().nonempty(),
  src_ip: z.string().ip(),
  src_country_code: z.string().nullable(),
  src_lat: z.string().nullable(),
  src_long: z.string().nullable(),
  src_port: z.string().nonempty(),
  dest_ip: z.string().ip(),
  dest_country_code: z.string().nullable(),
  dest_lat: z.string().nullable(),
  dest_long: z.string().nullable(),
  dest_port: z.string().nonempty(),
  timestamp: z.number().int(),
}).transform(({
  specific_address,
  country,
  malware,
  absolute_uri,
  proto,
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
  timestamp,
}) => ({
  specificAddress: specific_address,
  country: country ?? undefined,
  malware: malware ?? undefined,
  inRequest: {
    at: new Date(timestamp).toISOString(),
    proto: (
      proto === 'tcp'
      ? 'tcp'
      : proto === 'udp'
      ? 'udp'
      : 'unknown'
    ),
    srcIp: src_ip,
    srcPort: src_port,
    srcCountryCode: src_country_code ?? undefined,
    srcLat: src_lat ?? undefined,
    srcLong: src_long ?? undefined,
    destCountryCode: dest_country_code ?? undefined,
    destLat: dest_lat ?? undefined,
    destLong: dest_long ?? undefined,
    destIp: dest_ip,
    destPort: dest_port,
    URI: absolute_uri ?? undefined,
  },
} satisfies BanlistFinding['data']));

export type Row = z.infer<typeof Row>;

export async function runnerPure(
  query: () => Promise<unknown[]>,
): Promise<AnalysisOf<BanlistFinding>> {
  const reportedAt = (new Date()).toISOString();
  return {
    id: 'ip-banlist',
    title: 'Traffic Matches Configured IP Banlist',
    description: 'Traffic detected in a request matches an IP address on the '
      + 'configured banlist. This could be an indicator of compromise or port '
      + 'scanning activity.',
    reportedAt,
    severity: 'low',
    findings: (await query()).flatMap((row) => {
      const d = Row.safeParse(row);
      if (d.success) {
        return [{
          type: 'ip-banlist',
          name: 'Traffic Matches Configured IP Banlist',
          severity: 'low',
          detectedAt: reportedAt,
          occurredAt: {
            at: d.data.inRequest.at,
          },
          data: d.data,
        } satisfies BanlistFinding];
      }
      logger.debug({error: d.error, row: JSON.stringify(row)}, 'Invalid row data');
      return [];
    }),
  };
}

export async function IpBanlist(): Promise<Analysis[]> {
  const queryFunction = async () => (await conn.query(query, [])).rows;
  return [await runnerPure(queryFunction)];
}
