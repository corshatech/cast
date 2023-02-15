import { render } from '@testing-library/react';
import { UseOfBasicAuthCard } from './UseOfBasicAuthCard';

const reportedAt = new Date().toISOString();

describe('UseOfBasicAuthCard', () => {
  it('renders all passed props', () => {
    const { asFragment } = render(<UseOfBasicAuthCard
      id="use-of-basic-auth"
      title="Test title"
      description="Test description"
      reportedAt={reportedAt}
      severity="high"
      findings={[{
        type: 'use-of-basic-auth',
        name: 'Reused Authentication',
        detectedAt: reportedAt,
        severity: 'high',
        data: {
          inRequest: {
            at: reportedAt,
            destIp: '1.1.1.1',
            destPort: '5432',
            proto: 'tcp',
            srcIp: '2.2.2.2',
            srcPort: '1234',
            URI: 'https://example.com/',
          },
        },
      }]}
    />);
    expect(asFragment()).toMatchSnapshot();
  });
});
