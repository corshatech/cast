import { z } from 'zod';

export function TypedFetch<T extends z.ZodTypeAny>(scheme: T):
  (loc: string) => Promise<z.infer<T>> {
  return async (loc) => {
    const data = await (await fetch(loc)).json();
    if ('error' in data) {
      if (typeof data.error === 'string') {
        throw new Error(data.error);
      }
      throw new Error('Unknown error');
    }
    return scheme.parse(data);
  }
};
