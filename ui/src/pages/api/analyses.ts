import { NextApiRequest, NextApiResponse } from "next";
import { Analysis, AnalysisFunction, runAllAnalyses } from "lib/findings";
import { runner as reusedAuthentication } from "../../lib/analysis/reused-authentication";

const analysisFunctions: AnalysisFunction[] = [reusedAuthentication];

export type AnalysesResponse = {
  analyses: Analysis[],
}

const handler = async (
  _req: NextApiRequest,
  res: NextApiResponse<AnalysesResponse>,
) => {
  const analyses: Analysis[] = await runAllAnalyses(analysisFunctions);
  res.status(200).json({ analyses });
};

export default handler;
