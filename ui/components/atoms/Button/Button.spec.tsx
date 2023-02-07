import renderer from 'react-test-renderer';
import { Button } from './Button';

const cases: ['primary' | 'secondary', 'sm' | 'md' | 'lg'][] = [
  ['primary', 'sm'],
  ['primary', 'md'],
  ['primary', 'lg'],
  ['secondary', 'sm'],
  ['secondary', 'md'],
  ['secondary', 'lg'],
];

describe('Button', () => {
  test.each(cases)(
    'given %p as variant and %p as size, matches snapshot',
    (variant, size) => {
      const tree = renderer
        .create(
          <Button variant={variant} size={size}>
            Click Me
          </Button>,
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    },
  );
});
