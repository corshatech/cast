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

import type { NextApiRequest } from 'next';

import { Analysis, AnalysisFunction, runAllAnalyses } from '@/lib/findings';
import { reusedAuthentication } from '@/lib/analysis/reused-authentication';
import { passInUrl } from '@/lib/analysis/pass_in_url';
import { expiredJwt } from '@/lib/analysis/expired-jwt';
import { useOfBasicAuth } from '@/lib/analysis/useOfBasicAuth';
import { kubesec } from '@/lib/analysis/kubesec';
import { TypedAPIResponse } from '@/lib/internal';
import { requestTooSlow } from '@/lib/analysis/request_too_slow';

const analysisFunctions: AnalysisFunction[] = [
  reusedAuthentication,
  expiredJwt,
  passInUrl,
  useOfBasicAuth,
  requestTooSlow,
  kubesec,
];

export type AnalysesResponse = {
  analyses: Analysis[];
};

const handler = async (_req: NextApiRequest, res: TypedAPIResponse<AnalysesResponse>) => {
  try {
    const analyses: Analysis[] = await runAllAnalyses(analysisFunctions);
    res.status(200).json({ analyses });
  } catch (e) {
    console.error(e)
    res.status(500).send({error: 'Internal server error'})
  }
};

export default handler;
