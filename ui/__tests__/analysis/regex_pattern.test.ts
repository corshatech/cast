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
import { Finding } from '@/lib/findings';
import { runnerPure } from '../../lib/analysis/regex_pattern';

test('runner works', async () => {
  const query = () =>
    Promise.resolve([
      {
        src_ip: '192.2.0.1',
        src_port: '57944',
        dst_ip: '10.1.0.96',
        dst_port: '8181',
        finding: {
          Id: 'test',
          DetectedAt: '2023-01-18T13:12:01.000Z',
          Rule:  {
            id: 'PassInUrl',
            title: 'Broken Authentication: Password in Query String',
            description: 'A password or credential was detected in a URL as a query parameter. Using secure transport like HTTPS does not resolve the issue, because the URL may become logged or leak to third parties through e.g. the Referrer header. Do not include credentials in any part of a URL.',
            reportedAt: '2023-01-18T13:12:01.000Z',
            weaknessLink: 'https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url',
            weaknessTitle: '(OWASP) Information Exposure through Query Strings in URL',
            severity: 'high' as Finding['severity'],
            findings: [],
          },
          MatchText: '',
          AbsoluteUri: 'http://example.com/url-1',
          QueryParams: ['password', 'pass'],
        },
        timestamp: 1674047521000,
        uri: 'http://example.com/url-1',
        query_params: ['password', 'pass'],
      },
      {
        src_ip: '192.2.0.2',
        src_port: '57944',
        dst_ip: '10.1.0.96',
        dst_port: '8181',
        finding: {
          Id: 'test2',
          DetectedAt: '2023-01-18T13:12:01.000Z',
          Rule:  {
            id: 'PassInUrl',
            title: 'Broken Authentication: Password in Query String',
            description: 'A password or credential was detected in a URL as a query parameter. Using secure transport like HTTPS does not resolve the issue, because the URL may become logged or leak to third parties through e.g. the Referrer header. Do not include credentials in any part of a URL.',
            reportedAt: '2023-01-18T13:12:01.000Z',
            weaknessLink: 'https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url',
            weaknessTitle: '(OWASP) Information Exposure through Query Strings in URL',
            severity: 'high' as Finding['severity'],
            findings: [],
          },
          MatchText: '',
          AbsoluteUri: 'http://example.com/url-2',
          QueryParams: ['passwd'],
        },
        timestamp: 1674047522000,
        uri: 'http://example.com/url-2',
      },
    ]);

  const results = await runnerPure(query, 'PassInUrl');
  expect(results).toStrictEqual({
    id: 'regex-pattern',
    title: 'Broken Authentication: Password in Query String',
    description: 'A password or credential was detected in a URL as a query parameter. Using secure transport like HTTPS does not resolve the issue, because the URL may become logged or leak to third parties through e.g. the Referrer header. Do not include credentials in any part of a URL.',
    reportedAt: '2023-01-17T13:12:00.000Z',
    weaknessLink: 'https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url',
    weaknessTitle: '(OWASP) Information Exposure through Query Strings in URL',
    severity: 'high',
    findings: [
      {
        type: 'regex-pattern',
        name: 'Broken Authentication: Password in Query String',
        occurredAt: { at: '2023-01-18T13:12:01.000Z' },
        detectedAt: '2023-01-17T13:12:00.000Z',
        severity: 'high',
        data: {
          queryParams: ['password', 'pass'],
          inRequest: {
            srcIp: '192.2.0.1',
            srcPort: '57944',
            proto: 'tcp',
            destIp: '10.1.0.96',
            destPort: '8181',
            URI: 'http://example.com/url-1',
            at: '2023-01-18T13:12:01.000Z',
          },
          regexName: 'PassInUrl',
          weaknessLink: 'https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url',
          weaknessTitle: '(OWASP) Information Exposure through Query Strings in URL',
        },
        description: 'A password or credential was detected in a URL as a query parameter. Using secure transport like HTTPS does not resolve the issue, because the URL may become logged or leak to third parties through e.g. the Referrer header. Do not include credentials in any part of a URL.',
      },
      {
        type: 'regex-pattern',
        name: 'Broken Authentication: Password in Query String',
        occurredAt: { at: '2023-01-18T13:12:02.000Z' },
        detectedAt: '2023-01-17T13:12:00.000Z',
        severity: 'high',
        data: {
          queryParams: ['passwd'],
          inRequest: {
            srcIp: '192.2.0.2',
            srcPort: '57944',
            proto: 'tcp',
            destIp: '10.1.0.96',
            destPort: '8181',
            URI: 'http://example.com/url-2',
            at: '2023-01-18T13:12:02.000Z',
          },
          regexName: 'PassInUrl',
          weaknessLink: 'https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url',
          weaknessTitle: '(OWASP) Information Exposure through Query Strings in URL',
        },
        description: 'A password or credential was detected in a URL as a query parameter. Using secure transport like HTTPS does not resolve the issue, because the URL may become logged or leak to third parties through e.g. the Referrer header. Do not include credentials in any part of a URL.',
      },
    ],
  });
});
