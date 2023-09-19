/* Copyright 2022 Corsha.
   Licensed under the Apache License, Version 2.0 (the 'License');
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
   http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an 'AS IS' BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License. */

import type { NextApiResponse } from 'next';

import { z } from 'zod';

export { default as logger } from './logger';

export type TypedAPIResponse<T> = NextApiResponse<T | { error: string }>;

export const GeneralOperationResponse = z.union([
   z.object({success: z.literal(true)}),
   z.object({success: z.literal(false).optional(), error: z.string()}),
]);
export type GeneralOperationResponse = z.infer<typeof GeneralOperationResponse>;
