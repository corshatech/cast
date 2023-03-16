import React, { ReactNode } from 'react';
import { SWRConfig, Cache } from 'swr';
import { Fetcher, PublicConfiguration } from 'swr/_internal';

type Provider = { provider?: (cache: Readonly<Cache<any>>) => Cache<any> };

export async function customFetcher(url: string) {
  const res = await fetch(url);

  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!res.ok) {
    const json = await res.json();
    if ('error' in json && typeof json.error === 'string') {
      throw new Error(json.error);
    }
    throw new Error(json);
  }

  return res.json();
}

export function MySwrConfig({
  children,
  swrConfig,
}: {
  children?: ReactNode;
  // eslint-disable-next-line
  swrConfig?: Partial<PublicConfiguration<any, any, Fetcher<any>>> & Provider;
}) {
  return (
    <SWRConfig value={{ fetcher: customFetcher, ...swrConfig }}>
      {children}
    </SWRConfig>
  );
}
