import { runAllAnalyses, summarizeAnalyses, Analysis } from '../lib/findings';

const analysis1: Analysis = {
  id: 'reused-auth',
  title: 'Test Analysis 1',
  description: 'The first test analysis',
  reportedAt: '2023-01-17T13:12:00.000Z',
  severity: 'high',
  findings: [
    {
      type: 'reused-auth',
      name: 'Broken Authentication: Reused Authorization Header',
      occurredAt: {
        start: '2023-01-01T13:12:01.000Z',
        end: '2023-01-01T13:12:05.000Z',
      },
      detectedAt: '2023-01-17T13:12:00.000Z',
      severity: 'high',
      data: {
        auth: 'auth-header-1',
        inRequests: [
          {
            srcIp: '192.168.2.0',
            srcPort: '8080',
            proto: 'tcp',
            destIp: '192.168.2.100',
            destPort: '8080',
            URI: '/uri-1',
            at: '2023-01-01T13:12:01.000Z',
            count: 1,
          },
        ],
      },
    },
    {
      type: 'reused-auth',
      name: 'Broken Authentication: Reused Authorization Header',
      occurredAt: {
        start: '2023-01-01T13:12:02.000Z',
        end: '2023-01-01T13:12:07.000Z',
      },
      detectedAt: '2023-01-17T13:12:00.000Z',
      severity: 'high',
      data: {
        auth: 'auth-header-1',
        inRequests: [
          {
            srcIp: '192.168.3.0',
            srcPort: '8080',
            proto: 'tcp',
            destIp: '192.168.2.100',
            destPort: '8080',
            URI: '/uri-1',
            at: '2023-01-01T13:12:01.000Z',
            count: 1,
          },
        ],
      },
    },
  ],
};

const runner1 = (): Promise<Analysis> => Promise.resolve(analysis1);

const analysis2: Analysis = {
  id: 'reused-auth',
  title: 'Test Analysis 2',
  description: 'The second test analysis',
  reportedAt: '2023-01-17T13:12:00.000Z',
  severity: 'low',
  findings: [
    {
      type: 'reused-auth',
      name: 'Broken Authentication: Reused Authorization Header',
      occurredAt: {
        start: '2023-01-01T13:12:01.000Z',
        end: '2023-01-01T13:12:05.000Z',
      },
      detectedAt: '2023-01-17T13:12:00.000Z',
      severity: 'high',
      data: {
        auth: 'auth-header-1',
        inRequests: [
          {
            srcIp: '192.168.2.0',
            srcPort: '8080',
            proto: 'tcp',
            destIp: '192.168.2.100',
            destPort: '8080',
            URI: '/uri-1',
            at: '2023-01-01T13:12:01.000Z',
            count: 1,
          },
        ],
      },
    },
  ],
};

const passedAnalysis: Analysis = {
  id: 'reused-auth',
  title: 'Passed Analysis',
  description: 'The passed analysis',
  reportedAt: '2023-01-17T13:12:00.000Z',
  severity: 'medium',
  findings: [],
};

const runner2 = (): Promise<Analysis> => Promise.resolve(analysis2);

test('runAllFindings runs all findings', async () => {
  const results = await runAllAnalyses([runner1, runner2]);
  expect(results).toStrictEqual([analysis1, analysis2]);
});

test('summarizeAnalysesWorks', () => {
  const analyses = [analysis1, analysis2, passedAnalysis];
  const summary = summarizeAnalyses(analyses);
  expect(summary).toStrictEqual({
    faults: 2,
    scansPassed: 1,
    findings: 3,
    severityCounts: {
      none: 0,
      low: 1,
      medium: 0,
      high: 1,
      critical: 0,
    },
  })
});
