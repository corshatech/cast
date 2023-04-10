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
