import { Typography } from '@/components/atoms'
import { Summary, SummaryLoading } from '@/components/index';
import Box from '@mui/material/Box';
import { Analysis, AnalysisCardLoading } from '../../Analysis';
import { Analysis as AnalysisType } from '@/lib/findings';

const reusedAuth: AnalysisType = {
  id: 'reused-auth',
  title: 'Test Analysis 1',
  description: 'The first test analysis',
  reportedAt: '2023-01-17T13:12:00.000Z',
  severity: 'high',
  findings: [
    {
      type: 'reused-auth',
      name: 'Reused Authentication',
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
      name: 'Reused Authentication',
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

export const AnalysisSection = () => {
  const boxSx = { p: 2 };
  return (
    <>
      <div id="analysis-section" className="mb-8 mt-24">
        <Typography variant="h2" component="h2">
          Analysis
        </Typography>
        <Box sx={boxSx}>
          <Summary
            faults={0}
            scansPassed={17}
            findings={0}
            severityCounts={{ none: 0, low: 0, medium: 0, high: 0, critical: 0 }}
          />
        </Box>
        <Box sx={boxSx}>
          <Summary
            faults={7}
            scansPassed={10}
            findings={143}
            severityCounts={{ none: 0, low: 2, medium: 2, high: 0, critical: 3 }}
          />
        </Box>
        <Box sx={boxSx}>
          <Summary
            faults={7}
            scansPassed={10}
            findings={143}
            severityCounts={{ none: 1, low: 2, medium: 3, high: 4, critical: 5 }}
          />
        </Box>
        <Box sx={boxSx}>
          <SummaryLoading />
        </Box>

        <Box sx={boxSx}>
          <Analysis {...reusedAuth} />
        </Box>

        <Box sx={boxSx}>
          <AnalysisCardLoading />
        </Box>
      </div>
    </>
  )
}
