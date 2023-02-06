import renderer from 'react-test-renderer';
import { ButtonSection } from '@/components/index';

describe('Button', () => {
  it('snapshot', () => {
    const tree = renderer.create(<ButtonSection />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
