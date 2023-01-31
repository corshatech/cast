import { NextApiRequest, NextApiResponse } from "next";
import { Analysis, AnalysisFunction, runAllAnalyses } from "lib/findings";
import { runner as reusedAuthentication } from "../../lib/analysis/reused-authentication";
import { runner as pass_in_url } from "../../lib/analysis/pass_in_url";

const analysisFunctions: AnalysisFunction[] = [reusedAuthentication, pass_in_url];

export type AnalysesResponse = {
  analyses: Analysis[];
};

const handler = async (_req: NextApiRequest, res: NextApiResponse<AnalysesResponse>) => {
  const analyses: Analysis[] = await runAllAnalyses(analysisFunctions);
  res.status(200).json({ analyses });
};

export default handler;
