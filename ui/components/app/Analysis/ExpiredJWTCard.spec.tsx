

import { render } from '@testing-library/react';
import { ExpiredJWTCard } from './ExpiredJWTCard';

const reportedAt = new Date().toISOString();

describe('ExpiredJWTCard', () => {
  it('renders all passed props', () => {
    const { asFragment } = render(<ExpiredJWTCard
      id="expired-jwt"
      title="Test title"
      description="Test description"
      reportedAt={reportedAt}
      severity="high"
      findings={[{
        type: 'expired-jwt',
        name: 'Reused Authentication',
        detectedAt: reportedAt,
        severity: 'high',
        data: {
          expiredAt: reportedAt,
          inRequest: {
            at: reportedAt,
            destIp: '1.1.1.1',
            destPort: '5432',
            proto: 'tcp',
            srcIp: '2.2.2.2',
            srcPort: '1234',
            URI: 'https://example.com/',
          },
          jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
      }]}
    />);
    expect(asFragment()).toMatchSnapshot();
  });
});
