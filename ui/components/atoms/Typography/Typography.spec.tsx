import renderer from 'react-test-renderer';
import { Typography, TypographyProps } from './Typography';

const cases: [TypographyProps['variant'], TypographyProps['component']][] = [
  ['h1', 'h1'],
  ['h1', undefined],
  ['h2', 'h2'],
  ['h2', undefined],
  ['h3', 'h3'],
  ['h3', undefined],
  ['h4', 'h4'],
  ['h4', undefined],
  ['body1', 'p'],
  ['body1', undefined],
  ['body2', 'p'],
  ['body2', undefined],
  ['body3', 'p'],
  ['body3', undefined],
  ['body4', 'p'],
  ['body4', undefined],
];

describe('Typography', () => {
  test.each(cases)(
    'given %p as variant and %p as size, matches snapshot',
    (variant, component) => {
      const tree = renderer
        .create(
          <Typography variant={variant} component={component}>
            Typography Element
          </Typography>,
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    },
  );
});
