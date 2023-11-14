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

import { render } from '@testing-library/react';

import { RegexPatternCard } from './RegexPatternCard';

const reportedAt = new Date().toISOString();

describe('RegexPatternCard', () => {
  it('renders all passed props', () => {
    const { asFragment } = render(<RegexPatternCard
      anchorId='regex-pattern-Broken%20Authentication%3A%20Password%20in%20Query%20String'
      id="regex-pattern"
      title="Test title"
      description="Test description"
      reportedAt={reportedAt}
      severity="high"
      findings={[{
        type: 'regex-pattern',
        name: 'PassInUrl',
        detectedAt: reportedAt,
        severity: 'high',
        data: {
          weaknessLink: 'https://google.com',
          weaknessTitle: 'Broken Authentication: Password in Query String',
          description: 'A password or credential was detected in a URL as a ' +
            'query parameter. Using secure transport like HTTPS does not ' +
            'resolve the issue, because the URL may become logged or leak to ' +
            'third parties through e.g. the Referrer header. Do not include ' +
            'credentials in any part of a URL.',
          inRequest: {
            at: reportedAt,
            destIp: '1.1.1.1',
            destPort: '20',
            proto: 'tcp',
            srcIp: '2.2.2.2',
            srcPort: '5129',
            URI: 'https://example.com',
          },
        },
      }]}
    />);
    expect(asFragment()).toMatchSnapshot();
  });
});
