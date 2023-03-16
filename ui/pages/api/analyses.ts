import { NextApiRequest, NextApiResponse } from 'next';
import { Analysis, AnalysisFunction, runAllAnalyses } from 'lib/findings';
import { runner as reusedAuthentication } from '../../lib/analysis/reused-authentication';
import { runner as passInUrl } from '../../lib/analysis/pass_in_url';
import { runner as expiredJwt } from '../../lib/analysis/expired-jwt';
import { useOfBasicAuth } from '../../lib/analysis/useOfBasicAuth';

const analysisFunctions: AnalysisFunction[] = [
  reusedAuthentication,
  expiredJwt,
  passInUrl,
  useOfBasicAuth,
];

export type AnalysesResponse = {
  analyses: Analysis[];
};

const handler = async (_req: NextApiRequest, res: NextApiResponse<AnalysesResponse>) => {
  const analyses: Analysis[] = await runAllAnalyses(analysisFunctions);
  res.status(200).json({ analyses });
};

export default handler;
