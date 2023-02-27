import { CssBaseline, ThemeProvider } from '@mui/material';
import React from 'react';

import { theme } from '@/components/app/theme';

export interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (<ThemeProvider theme={theme}>
    <CssBaseline/>
    <div className="m-0 flex flex-col justify-between items-start w-screen">
      {children}
    </div>
  </ThemeProvider>);
};
