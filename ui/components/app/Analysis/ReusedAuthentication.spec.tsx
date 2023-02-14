

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
          inRequests: [],
        },
      }]}
    />);
    expect(asFragment()).toMatchSnapshot();
  });
});
