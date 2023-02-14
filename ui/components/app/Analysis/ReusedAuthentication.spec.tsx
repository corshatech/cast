import { render } from '@testing-library/react';
import { ReusedAuthenticationCard } from './ReusedAuthentication';

// construct the Unix Epoch in the local timezone.
// Should cause test dates to read as midnight Jan 1 1970 when printed
const reportedAt = new Date(1970, 0, 1).toISOString();

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
          inRequests: [],
        },
      }]}
    />);
    expect(asFragment()).toMatchSnapshot();
  });
});
