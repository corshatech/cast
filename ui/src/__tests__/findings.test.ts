import { runAllAnalyses, Analysis } from "../lib/findings";

const analysis1 = {
  id: "123-analysis",
  name: "Test Analysis 1",
  description: "The first test analysis",
  priority: 1,
  findings: [],
};

const runner1 = (): Promise<Analysis> => Promise.resolve(analysis1);

const analysis2 = {
  id: "321-analysis",
  name: "Test Analysis 2",
  description: "The second test analysis",
  priority: 2,
  findings: [],
};

const runner2 = (): Promise<Analysis> => Promise.resolve(analysis2);

test("runAllFindings runs all findings", async () => {
  const results = await runAllAnalyses([runner1(), runner2()]);
  expect(results).toStrictEqual([analysis1, analysis2]);
});

test("runAllFindings runs and sorts all findings", async () => {
  // The order should be the same
  expect(await runAllAnalyses([runner1(), runner2()])).toStrictEqual(
    await runAllAnalyses([runner2(), runner1()]),
  );
});
