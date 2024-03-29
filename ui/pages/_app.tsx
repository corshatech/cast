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

import type { AppProps } from 'next/app';
import { ThemeProvider } from '@mui/material';
import { TooltipProvider } from '@radix-ui/react-tooltip';

import { MySwrConfig } from '@/components/app/MySwrConfig';
import { theme } from '@/components/app/theme';

import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MySwrConfig>
      <ThemeProvider theme={theme}>
        {/* TODO: Using all the defaults for now */}
        <TooltipProvider>
          <Component {...pageProps} />
        </TooltipProvider>
      </ThemeProvider>
    </MySwrConfig>
  );
}
