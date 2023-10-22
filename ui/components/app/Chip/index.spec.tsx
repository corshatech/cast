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

import { render } from '@testing-library/react';

import { Chip } from '.';

describe('Chip', () => {
  it('renders all passed props', () => {
    const { asFragment } = render(<Chip className="bg-white">Test Label</Chip>);
    expect(asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <span
          class="px-2 text-white font-semibold rounded-full inline bg-white"
        >
          Test Label
        </span>
      </DocumentFragment>
    `);
  });
});
