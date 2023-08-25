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
import { runnerPure } from '../../lib/analysis/expired-jwt';

test('runner works', async () => {
  const query = () =>
    Promise.resolve([
      // expired jwt
      {
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE2NzI0MjM5NjJ9.FaOoRpL28jWo9P41BNCYzx1lbESJd-pn_Vp6_REGQEg',
        absolute_uri: '/url-1',
        src_ip: '192.0.2.1',
        src_port: '5432',
        timestamp: 1672578721000,
        protocol: 'tcp',
        destination_ip: '192.0.2.2',
        destination_port: '5432',
      },
      // jwt with no expiration
      {
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        absolute_uri: '/url-1',
        src_ip: '192.0.2.1',
        src_port: '5432',
        timestamp: 1672578721000,
        protocol: 'tcp',
        destination_ip: '192.0.2.2',
        destination_port: '5432',
      },
    ]);

  const results = await runnerPure(query);
  expect(results).toStrictEqual({
    id: 'expired-jwt',
    title: 'Broken Authentication: Expired JWTs',
    description:
      'A client is trying to authenticate with your API using an expired ' +
      'JWT. While a correctly-configured server should reject these claims ' +
      'as unauthorized, this behavior could be a sign of: (1) a poorly ' +
      'behaving client that may have a bug or need to be updated with better ' +
      'token handling, or (2) a replay attack against your infrastructure. ' +
      'Ensure that your servers validate the authenticity and expiration ' +
      'date of JWTs, as well as reject unsigned/weakly signed JWTs. Also ' +
      'ensure that your clients are well-behaved and refresh their tokens at ' +
      'the necessary intervals.',
    reportedAt: '2023-01-17T13:12:00.000Z',
    severity: 'low',
    weaknessLink: 'https://owasp.org/API-Security/editions/2023/en/0xa2-broken-authentication/',
    weaknessTitle: '(OWASP) API2:2023 Broken Authentication',
    findings: [
      {
        type: 'expired-jwt',
        name: 'Broken Authentication: Expired JWTs',
        detectedAt: '2023-01-17T13:12:00.000Z',
        severity: 'low',
        occurredAt: {
          at: '2023-01-01T13:12:01.000Z',
        },
        data: {
          jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE2NzI0MjM5NjJ9.FaOoRpL28jWo9P41BNCYzx1lbESJd-pn_Vp6_REGQEg',
          expiredAt: '2022-12-30T18:12:42.000Z',
          inRequest: {
            URI: '/url-1',
            at: '2023-01-01T13:12:01.000Z',
            destIp: '192.0.2.2',
            destPort: '5432',
            proto: 'tcp',
            srcIp: '192.0.2.1',
            srcPort: '5432',
          },
        },
      },
    ],
  });
});
