import { NextApiRequest, NextApiResponse } from 'next';
import {
  Analysis,
  AnalysisFunction,
  runAllAnalyses,
} from '../../libs/findings';
import { runner as reusedAuthentication } from '../../libs/analysis/reused-authentication';
import { useOfBasicAuth } from '../../libs/analysis/useOfBasicAuth';

const analysisFunctions: AnalysisFunction[] = [
  reusedAuthentication,
  useOfBasicAuth,
];

export type AnalysesResponse = {
  analyses: Analysis[];
};

const handler = async (
  _req: NextApiRequest,
  res: NextApiResponse<AnalysesResponse>,
) => {
  const analyses: Analysis[] = await runAllAnalyses(analysisFunctions);
  res.status(200).json({ analyses });
};

export default handler;
