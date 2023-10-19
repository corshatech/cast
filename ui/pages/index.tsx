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

import Head from 'next/head';
import useSWR from 'swr';
import { Alert, Typography, useTheme } from '@mui/material';

import type { AnalysesResponse } from '@/pages/api/analyses';
import { AnalysisCard, AnalysisCardLoading } from '@/components/app/Analysis';
import { Header } from '@/components/app/Header';
import { Layout } from '@/components/app/Layout';
import { Analysis, Severity, summarizeAnalyses } from '@/lib/findings';
import { EnablementChip } from '@/components/app/EnablementChip';
import { TypedFetch } from '@/lib/TypedFetch';
import { CASTFeaturesListing } from '@/lib/metadata';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Chip } from '@/components/app/Chip';

export default function Dashboard() {
  const { data: analysesResponse, isLoading, error } = useSWR<AnalysesResponse>('/api/analyses');
  const { data: enablements } = useSWR('/api/enablements', TypedFetch(CASTFeaturesListing))

  /******************************
   * TODO: REMOVE ME
   * 
   * Remove refresh, this should be implemented as a scheduled job
   ******************************/ 
  useSWR(
    '/api/matview-refresh?refresh=true', 
    (url) => fetch(url, { method: 'POST' }),
    { refreshInterval: 1000 * 60 * 5 /* Every 5 minutes (ms) */ },
  )

  const theme = useTheme();

  const summary =
    analysesResponse &&
    summarizeAnalyses(analysesResponse.analyses);
  const analyses = analysesResponse?.analyses ?? [];

  const summaryTitle = summary?.faults
    ? `${summary.faults} Faults (${summary.findings} Findings)`
    : `No problems detected yet. Live scanning will continue in the background.`;

    
    const analysesBySeverity: Record<Severity, Analysis[]> = analyses.reduce<
      Record<Severity, Analysis[]>
    >(
      (prev, curr) => {
        const severity = curr?.findings?.length > 0 ? curr.severity : 'none';
        return {
          ...prev,
          [severity]: [...prev[severity], curr],
        };
      },
      {
        none: [],
        low: [],
        medium: [],
        high: [],
        critical: [],
      },
    );

    // The none category contains 'none' severity analyses as well as
    // analyses with no findings. Sort to have 'none' severity analyses first:
    analysesBySeverity['none'].sort((a) => a.findings.length > 0 ? 0 : 1)


  const findingsChip = (severity: Severity) => {
    // Find number of analyses with no findings in grouped analyses if severity is none
    const numNoFindings = 
      severity === 'none' ? 
        analysesBySeverity.none.reduce(
          (prev, curr) => curr.findings.length === 0 ? prev + 1 : 0,
          0,
        )
      : -1

    return (
      <>
        {summary && summary.severityCounts[severity] > 0 &&
          <Chip className='ml-2'>
            {Intl.NumberFormat('en', {
              notation: 'compact',
              maximumFractionDigits: 2,
            }).format(summary.severityCounts[severity])}
          </Chip>
        }
        {numNoFindings > 0 && 
          <Chip className='ml-2 bg-green-300'>
            {Intl.NumberFormat('en', {
              notation: 'compact',
              maximumFractionDigits: 2,
            }).format(numNoFindings)}
          </Chip>
        }
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Summary</title>
      </Head>
      <Layout>
        <Header />
        <main className="w-screen">
          {error && (
            <Alert severity="error">
              An Error Occurred loading analysis: {error.toString()}
            </Alert>
          )}
          <div className="max-w-screen 2xl:max-4K:max-w-10xl mx-auto px-4 sm:px-6 lg:px-8 my-4">
            <div className="my-12">
              <Typography variant="h1" className='md:text-5xl xl:text-7xl'>
                Ongoing Results
              </Typography>
              <div className='flex flex-col md:flex-row space-y-5 md:space-y-0 md:items-center md:space-x-3 md:ml-1 md:pt-6 xl:pt-8'>
                {summary ? (
                  <>
                    <Typography variant="h4" className='md:text-2xl xl:text-3xl'>
                      {summaryTitle}
                    </Typography>
                    <Typography style={{ color: theme.palette.text.secondary }} className='xl:text-xl font-semibold'>
                      {summary?.scansPassed || 0} passed
                    </Typography>
                  </>
                ) : (
                  <>
                    <div className={'h-9 w-60 rounded-lg bg-slate-50 bg-slate-400/10 animate-pulse'} />
                    <div className={'h-7 w-20 rounded-lg bg-slate-50 bg-slate-400/10 animate-pulse'} />
                  </>
                )}
              </div>
            </div>

            {isLoading && analyses.length === 0 && !error ? (
              <div className="absolute w-full h-full z-50 bg-slate-400/10 animate-pulse"/>
            ) : (
              <Tabs defaultValue="critical">
                <TabsList className='w-full h-14 overflow-x-scroll grid grid-flow-col justify-stretch'>
                  <TabsTrigger className='h-full' value="critical">Critical {findingsChip('critical')}</TabsTrigger>
                  <TabsTrigger className='h-full' value="high">High {findingsChip('high')}</TabsTrigger>
                  <TabsTrigger className='h-full' value="medium">Medium {findingsChip('medium')}</TabsTrigger>
                  <TabsTrigger className='h-full' value="low">Low {findingsChip('low')}</TabsTrigger>
                  <TabsTrigger className='h-full' value="none">None {findingsChip('none')}</TabsTrigger>
                  <TabsTrigger className='h-full' value="status">Status</TabsTrigger>
                  <TabsTrigger className='h-full' value="settings">Settings</TabsTrigger>
                </TabsList>
                {Object.entries(analysesBySeverity).map((analysesForSeverity) => (
                  <TabsContent key={analysesForSeverity[0]} value={analysesForSeverity[0]}>
                    {analysesForSeverity[1].length === 0 ? (
                      <p>No results in this category</p>
                    ) : (
                      <div className='flex flex-col gap-4'>
                        {analysesForSeverity[1].map((analysis) => (
                          <AnalysisCard key={analysis.id} {...analysis}/>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
                <TabsContent value='status'>
                  <div className="flex flex-col gap-2 items-start">
                    { enablements && <>
                      <a
                        rel="noopener noreferrer" 
                        target="_blank"
                        href="https://github.com/corshatech/cast/wiki/Activating-Optional-Features#maxmind-geolite2-data"
                      >
                        <EnablementChip
                          label='GeoIP Data'
                          tooltipEnabled='MaxMind GeoIP data has been loaded.'
                          tooltipDisabled='No MaxMind GeoIP data has been found. Check the CAST Wiki for details.'
                          enabled={enablements.geoIpEnabled}
                        />
                      </a>
                      <a
                        rel="noopener noreferrer" 
                        target="_blank"
                        href="https://github.com/corshatech/cast/wiki/Activating-Optional-Features#feodo-banlist-data"
                      >
                        <EnablementChip
                          label='IP Banlist Data'
                          tooltipEnabled='FEODOTracker data has been loaded.'
                          tooltipDisabled='No FEODOTracker ddata has been found. Check the CAST Wiki for details.'
                          enabled={enablements.feodoEnabled}
                        />
                      </a>
                    </>}
                  </div>
                </TabsContent>
                <TabsContent value='settings'>
                  <p>This page is under construction</p>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </Layout>
    </>
  );
}
