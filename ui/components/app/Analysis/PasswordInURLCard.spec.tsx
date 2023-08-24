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

import { PasswordInURLCard } from './PasswordInURLCard';

const reportedAt = new Date().toISOString();

describe('PasswordInURLCard', () => {
  it('renders all passed props', () => {
    const { asFragment } = render(<PasswordInURLCard
      id="pass-in-url"
      title="Test title"
      description="Test description"
      reportedAt={reportedAt}
      severity="high"
      findings={[{
        type: 'pass-in-url',
        name: 'Test Finding',
        detectedAt: reportedAt,
        severity: 'high',
        data: {
          inRequest: {
            at: reportedAt,
            destIp: '1.1.1.1',
            destPort: '20',
            proto: 'tcp',
            srcIp: '2.2.2.2',
            srcPort: '5129',
            URI: 'https://example.com',
          },
          queryParams: ['password'],
        },
      }]}
    />);
    expect(asFragment()).toMatchSnapshot();
  });
});
