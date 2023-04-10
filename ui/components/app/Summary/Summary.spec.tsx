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
import { Summary, SummaryLoading } from '@/components/app/Summary';

describe('Analyses Summary Component', () => {
  it('renders no problems variant', () => {
    const tree = renderer.create(
      <Summary
        faults={0}
        scansPassed={17}
        findings={0}
        severityCounts={{ none: 0, low: 0, medium: 0, high: 0, critical: 0 }}
      />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders some problems variant', () => {
    const tree = renderer.create(
      <Summary
        faults={7}
        scansPassed={10}
        findings={143}
        severityCounts={{ none: 0, low: 2, medium: 2, high: 0, critical: 3 }}
      />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders all problems variant', () => {
    const tree = renderer.create(
      <Summary
        faults={7}
        scansPassed={10}
        findings={143}
        severityCounts={{ none: 1, low: 2, medium: 3, high: 4, critical: 5 }}
      />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

describe('Analyses Summary Loading Component', () => {
  it('rednders correctly', () => {
    const tree = renderer.create(
      <SummaryLoading />).toJSON();
    expect(tree).toMatchSnapshot();
  })
})
