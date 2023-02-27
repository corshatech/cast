import { z } from 'zod';

export function TypedFetch<T extends z.ZodTypeAny>(scheme: T):
  (loc: string) => Promise<z.infer<T>> {
  return async (loc) => {
    const data = await (await fetch(loc)).json();
    const parse = scheme.safeParse(data);
    if (parse.success) {
      return parse.data;
    }

    // custom error reporting based on the Zod result
    console.error(parse.error);
    // re-throw, or generate a nice user-facing error message:
    throw parse.error;
  };
}
