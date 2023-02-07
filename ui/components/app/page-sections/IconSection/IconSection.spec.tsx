import renderer from 'react-test-renderer';
import { IconSection } from '@/components/index';

describe('Icon Section', () => {
  it('snapshot', () => {
    const tree = renderer.create(<IconSection />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
