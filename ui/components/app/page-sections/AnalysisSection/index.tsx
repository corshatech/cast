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

import Box from '@mui/material/Box';

import { Typography } from '@/components/atoms/Typography'
import { Summary, SummaryLoading } from '@/components/app/Summary';
import { AnalysisCard, AnalysisCardLoading } from '@/components/app/Analysis';
import { Analysis } from '@/lib/findings';

const reusedAuth: Analysis = {
  id: 'reused-auth',
  title: 'Test Analysis 1',
  description: 'The first test analysis',
  reportedAt: '2023-01-17T13:12:00.000Z',
  severity: 'high',
  findings: [
    {
      type: 'reused-auth',
      name: 'Broken Authentication: Reused Authorization',
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
      name: 'Broken Authentication: Reused Authorization',
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
          <AnalysisCard {...reusedAuth} />
        </Box>

        <Box sx={boxSx}>
          <AnalysisCardLoading />
        </Box>
      </div>
    </>
  )
}
