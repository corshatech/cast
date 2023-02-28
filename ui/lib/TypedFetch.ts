import { z } from 'zod';

export function TypedFetch<T extends z.ZodTypeAny>(scheme: T):
  (loc: string) => Promise<z.infer<T>> {
  return async (loc) => {
    const data = await (await fetch(loc)).json();
    return scheme.parse(data);
  }
}
