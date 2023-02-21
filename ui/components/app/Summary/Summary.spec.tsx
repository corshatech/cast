import renderer from 'react-test-renderer';
import { Summary, SummaryLoading } from '@/components/index';

describe('Analyses Summary Component', () => {
  it('renders no problems variant', () => {
    const tree = renderer.create(
      <Summary
        faults={0}
        scansPassed={17}
        findings={0}
        severityCounts={{ none: 0, low: 0, medium: 0, high: 0, critical: 0 }}
      />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders some problems variant', () => {
    const tree = renderer.create(
      <Summary
        faults={7}
        scansPassed={10}
        findings={143}
        severityCounts={{ none: 0, low: 2, medium: 2, high: 0, critical: 3 }}
      />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders all problems variant', () => {
    const tree = renderer.create(
      <Summary
        faults={7}
        scansPassed={10}
        findings={143}
        severityCounts={{ none: 1, low: 2, medium: 3, high: 4, critical: 5 }}
      />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

describe('Analyses Summary Loading Component', () => {
  it('rednders correctly', () => {
    const tree = renderer.create(
      <SummaryLoading />).toJSON();
    expect(tree).toMatchSnapshot();
  })
})
