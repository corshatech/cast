import renderer from 'react-test-renderer';
import { TypographySection } from '@/components/index';

describe('Typography Section', () => {
  it('snapshot', () => {
    const tree = renderer.create(<TypographySection />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
