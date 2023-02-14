import { render, screen } from '@testing-library/react';
import { AnalysisCard } from './';

const reportedAt = new Date().toISOString();

describe('AnalysisCard', () => {
  it('renders all passed props', () => {
    const { asFragment } = render(<AnalysisCard
      description="Test description"
      weaknessLink="Test weakness link"
      weaknessTitle="Test weakness title"
      title="Test title"
      severity="none"
      reportedAt={reportedAt}
    />);
    expect(asFragment()).toMatchSnapshot();
  });
  it('renders a weaknessLink without title', () => {
    const { asFragment } = render(<AnalysisCard
      description="Test description"
      weaknessLink="Test weakness link"
      title="Test title"
      severity="none"
      reportedAt={reportedAt}
    />);
    expect(asFragment()).toMatchSnapshot();
  });
  it('Does not render a WeaknessLink when given a title but no Link', () => {
    const { asFragment } = render(<AnalysisCard
      description="Test description"
      weaknessTitle="Test weakness title"
      title="Test title"
      severity="none"
      reportedAt={reportedAt}
    />)

    const weaknessTitle = screen.queryByText('Test weakness title')
    // Specifically expect this text to be missing:
    expect(weaknessTitle).toBeNull()
    expect(asFragment()).toMatchSnapshot()
  });
});
