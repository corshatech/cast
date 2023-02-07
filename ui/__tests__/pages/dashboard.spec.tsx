import { render, screen } from '@testing-library/react';
import Dashboard from '@/pages/index';

describe('Dashboard Page: ', () => {
  it('renders', () => {
    render(<Dashboard />);
    const pageTitle = screen.getByText('Summary');
    expect(pageTitle).toBeInTheDocument();
  });
});
