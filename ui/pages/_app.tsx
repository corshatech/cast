import { MySwrConfig } from '@/components/app/MySwrConfig';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MySwrConfig>
      <Component {...pageProps} />
    </MySwrConfig>
  );
}
