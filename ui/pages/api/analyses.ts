import { NextApiRequest, NextApiResponse } from 'next';
import { Analysis, AnalysisFunction, runAllAnalyses } from 'lib/findings';
import { runner as reusedAuthentication } from '../../lib/analysis/reused-authentication';
import { runner as passInUrl } from '../../lib/analysis/pass_in_url';
import { runner as expiredJwt } from '../../lib/analysis/expired-jwt';
import { useOfBasicAuth } from '../../lib/analysis/useOfBasicAuth';
import { kubesec } from '../../lib/analysis/kubesec';
import { TypedAPIResponse } from '@/lib/internal';

const analysisFunctions: AnalysisFunction[] = [
  reusedAuthentication,
  expiredJwt,
  passInUrl,
  useOfBasicAuth,
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
