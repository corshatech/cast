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
import { makeFinding, Severity } from '../findings';

const innerKubesecData = z.object({
  'Resource': z.string().nonempty().describe('Resource name in k8s'),
  'Namespace': z.string().nonempty().describe('Resource namespace in k8s'),
  'Rule ID': z.string().nonempty().describe('The kubesec rule that triggered'),
  'Selector': z.string().nonempty().describe('The resource selector used by the kubesec rule'),
  'Reason': z.string().nonempty().describe('The human-readable description of the issue, as given by Kubesec'),
  'Points': z.coerce.number().describe('The kubesec score points indicating how severe this finding is'),
});

export const KubesecSQLRow = z.object({
  // id
  id: z.string(),
  // sql lowercases things
  detectedat: z.date(),
  // plugin_name
  type: z.literal('cast-kubesec'),
  // `data` object shape:
  data: innerKubesecData.extend({
    Severity,
  }),
}).describe('The schema for Kubesec findings data, exported by our Go plugin for Kubesec');

export const KubesecFinding = makeFinding(
  'cast-kubesec',
  innerKubesecData,
);

export type KubesecFinding = z.infer<typeof KubesecFinding>;

export const kubesecRowToFinding = ({
  type,
  detectedat,
  data: {
    Severity,
    ...data
  },
}: z.infer<typeof KubesecSQLRow>): KubesecFinding => ({
  severity: Severity,
  detectedAt: detectedat.toISOString(),
  name: 'Kubesec Finding',
  type,
  data,
});
