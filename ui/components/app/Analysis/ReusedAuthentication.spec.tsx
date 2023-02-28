

import { render } from '@testing-library/react';
import { ReusedAuthenticationCard } from './ReusedAuthentication';

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
        name: 'Reused Authentication',
        detectedAt: reportedAt,
        severity: 'high',
        data: {
          auth: 'test-data-auth',
          inRequests: [{
            at: reportedAt,
            destIp: '1.1.1.1',
            destPort: '20',
            proto: 'tcp',
            srcIp: '2.2.2.2',
            srcPort: '5129',
            URI: 'https://example.com',
            count: 1,
          }, {
            at: reportedAt,
            destIp: '1.1.1.1',
            destPort: '20',
            proto: 'tcp',
            srcIp: '1.1.1.1',
            srcPort: '5129',
            URI: 'https://example.com',
            count: 1,
          }],
        },
      }]}
    />);
    expect(asFragment()).toMatchSnapshot();
  });
});
