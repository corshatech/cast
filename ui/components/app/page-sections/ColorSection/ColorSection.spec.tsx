import renderer from 'react-test-renderer';
import { ColorSection } from '@/components/index';

describe('Color Section', () => {
  it('snapshot', () => {
    const tree = renderer.create(<ColorSection />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
