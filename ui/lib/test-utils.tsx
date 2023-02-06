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
