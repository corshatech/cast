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
import { runnerPure } from '../../lib/analysis/ip-banlist';

describe('IP Banlist Analysis', () => {
  it('works for a simple snapshot test', async () => {
    const query = () =>
      Promise.resolve([
        {
          specific_address: '1.2.3.4',
          country: 'US',
          malware: 'Pikabot',
          absolute_uri: 'https://example.com/',
          proto: 'tcp',
          src_ip: '4.5.6.7',
          src_port: '228',
          destination_ip: '3.4.5.6',
          destination_port: '973',
          timestamp: 42,
        },
      ]);

    const results = await runnerPure(query);
    expect(results?.findings).toHaveLength(1);
    expect(results).toMatchInlineSnapshot(`
      {
        "description": "Traffic detected in a request matches an IP address on the configured banlist. This could be an indicator of compromise or port scanning activity.",
        "findings": [
          {
            "data": {
              "country": "US",
              "inRequest": {
                "URI": "https://example.com/",
                "at": "1970-01-01T00:00:00.042Z",
                "destIp": "3.4.5.6",
                "destPort": "973",
                "proto": "tcp",
                "srcIp": "4.5.6.7",
                "srcPort": "228",
              },
              "malware": "Pikabot",
              "specificAddress": "1.2.3.4",
            },
            "detectedAt": "2023-01-17T13:12:00.000Z",
            "name": "Traffic Matches Configured IP Banlist",
            "occurredAt": {
              "at": "1970-01-01T00:00:00.042Z",
            },
            "severity": "low",
            "type": "ip-banlist",
          },
        ],
        "id": "ip-banlist",
        "reportedAt": "2023-01-17T13:12:00.000Z",
        "severity": "low",
        "title": "Traffic Matches Configured IP Banlist",
      }
    `);
  });

  it('Discards data on malformed query rows', async () => {
    const query = () => Promise.resolve([{ a: 4 }]);
    const response = await runnerPure(query);

    expect(response?.findings).toHaveLength(0);
    expect(response).toMatchInlineSnapshot(`
      {
        "description": "Traffic detected in a request matches an IP address on the configured banlist. This could be an indicator of compromise or port scanning activity.",
        "findings": [],
        "id": "ip-banlist",
        "reportedAt": "2023-01-17T13:12:00.000Z",
        "severity": "low",
        "title": "Traffic Matches Configured IP Banlist",
      }
    `);
  });
});
