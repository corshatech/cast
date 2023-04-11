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

import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';

import { AnalysisCard, AnalysisCardLoading } from './';

const reportedAt = new Date().toISOString();

describe('AnalysisCard', () => {
  it('renders all passed props', () => {
    const { asFragment } = render(<AnalysisCard
      description="Test description"
      weaknessLink="Test weakness link"
      weaknessTitle="Test weakness title"
      title="Test title"
      severity="none"
      reportedAt={reportedAt}
    />);
    expect(asFragment()).toMatchSnapshot();
  });
  it('renders a weaknessLink without title', () => {
    const { asFragment } = render(<AnalysisCard
      description="Test description"
      weaknessLink="Test weakness link"
      title="Test title"
      severity="none"
      reportedAt={reportedAt}
    />);
    expect(asFragment()).toMatchSnapshot();
  });
  it('Does not render a WeaknessLink when given a title but no Link', () => {
    const { asFragment } = render(<AnalysisCard
      description="Test description"
      weaknessTitle="Test weakness title"
      title="Test title"
      severity="none"
      reportedAt={reportedAt}
    />)

    const weaknessTitle = screen.queryByText('Test weakness title')
    // Specifically expect this text to be missing:
    expect(weaknessTitle).toBeNull()
    expect(asFragment()).toMatchSnapshot()
  });
});

describe('AnalysisCardLoading', () => {
  it('renders as expected', () => {
    const tree = renderer.create(
      <AnalysisCardLoading />).toJSON();

    expect(tree).toMatchSnapshot();

  })
})
