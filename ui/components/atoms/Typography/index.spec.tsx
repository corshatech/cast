/* Copyright 2023 Corsha.
   Licensed under the Apache License, Version 2.0 (the 'License');
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
   http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an 'AS IS' BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License. */

import renderer from 'react-test-renderer';

import { Typography, TypographyProps } from '.';

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
