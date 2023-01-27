import { runAllAnalyses, Analysis } from "../lib/findings";

const analysis1 = {
  id: "123-analysis",
  title: "Test Analysis 1",
  description: "The first test analysis",
  reportedAt: "2023-01-17T13:12:00.000Z",
  severity: "high",
  findings: [],
};

const runner1 = (): Promise<Analysis> => Promise.resolve(analysis1);

const analysis2 = {
  id: "321-analysis",
  title: "Test Analysis 2",
  description: "The second test analysis",
  reportedAt: "2023-01-17T13:12:00.000Z",
  severity: "high",
  findings: [],
};

const runner2 = (): Promise<Analysis> => Promise.resolve(analysis2);

test("runAllFindings runs all findings", async () => {
  const results = await runAllAnalyses([runner1, runner2]);
  expect(results).toStrictEqual([analysis1, analysis2]);
});
