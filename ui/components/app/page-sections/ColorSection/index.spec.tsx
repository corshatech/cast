import renderer from 'react-test-renderer';
import { ColorSection } from '@/components/app/page-sections';

describe('Color Section', () => {
  it('snapshot', () => {
    const tree = renderer.create(<ColorSection />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
