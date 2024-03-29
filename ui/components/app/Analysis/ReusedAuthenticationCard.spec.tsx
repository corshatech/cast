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

import { ReusedAuthenticationCard } from './ReusedAuthenticationCard';

const reportedAt = new Date().toISOString();

describe('ReusedAuthenticationCard', () => {
  it('renders all passed props', () => {
    const { asFragment } = render(<ReusedAuthenticationCard
      id="reused-auth"
      title="Test title"
      description="Test description"
      reportedAt={reportedAt}
      severity="high"
      findings={[{
        type: 'reused-auth',
        name: 'Broken Authentication: Reused Authorization',
        detectedAt: reportedAt,
        severity: 'high',
        data: {
          auth: 'test-data-auth',
          uri: 'https://example.com',
          count: 1,
          requests: [{
            at: reportedAt,
            trafficId: '1',
            direction: 'src',
            ipAddr: '1.1.1.1',
            port: '20',
          }, 
          {
            at: reportedAt,
            trafficId: '2',
            direction: 'src',
            ipAddr: '1.1.1.1',
            port: '20',
          }],
        },
      }]}
    />);
    expect(asFragment()).toMatchSnapshot();
  });
});
