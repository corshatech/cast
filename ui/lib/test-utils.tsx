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

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

import { MySwrConfig } from '@/components/app/MySwrConfig';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MySwrConfig swrConfig={{ dedupingInterval: 0, provider: () => new Map() }}>
      {children}
    </MySwrConfig>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
