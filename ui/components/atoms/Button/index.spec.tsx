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
import { Button } from '.';

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
