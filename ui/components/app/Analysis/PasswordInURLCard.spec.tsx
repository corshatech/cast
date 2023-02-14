

import { render } from '@testing-library/react';
import { PasswordInURLCard } from './PasswordInURLCard';

const reportedAt = new Date().toISOString();

describe('ReusedAuthenticationCard', () => {
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
