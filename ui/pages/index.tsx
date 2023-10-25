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
import { cx } from 'class-variance-authority';
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

const severityToColor: Record<Severity, string> = {
  none: 'border-gray-600 bg-gray-700/25',
  critical: 'border-red-800 bg-red-500',
  high: 'border-red-700 bg-red-800/25',
  low: 'border-orange-600 bg-orange-700/25',
  medium: 'border-yellow-600 bg-yellow-700/25',
}

const formatNumber = (findings: number) =>
  Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(findings)

export default function Dashboard() {
  const { data: analysesResponse, isLoading, error } = useSWR<AnalysesResponse>('/api/analyses');
  const { data: enablements, error: error2 } = useSWR('/api/enablements', TypedFetch(CASTFeaturesListing))

  const theme = useTheme();

  const summary =
    analysesResponse &&
    summarizeAnalyses(analysesResponse.analyses);
  const analyses = analysesResponse?.analyses ?? [];

  const mError = error ?? error2 ?? undefined;

  const summaryTitle = summary?.faults
    ? `${summary.faults} Issues (${summary.findings} individual infractions)`
    : `No problems detected yet. Live scanning will continue in the background.`;

  return (
    <>
      <Head>
        <title>CAST by Corsha</title>
      </Head>
      <Layout>
        <Header big />
        {mError && (
          <Alert severity="error" className='w-full'>
            An Error Occurred loading analysis: {mError.toString()}
          </Alert>
        )}
        <div className="grid grid-cols-[24rem_1fr] grid-flow-row w-full">
          <nav className="w-96 px-2 pl-6 pt-12 h-screen sticky top-0 overflow-auto">
            <Typography variant="h5" className="pl-6">Navigation</Typography>
            {analyses.length > 0 &&
              <ul className='flex flex-col gap-6 mt-6'>
                {analyses.map((a) => (
                  <li key={a.id}>
                    <a href={'#' + a.id} className='hover:underline underline-offset-4'>
                      <Typography variant="body1">
                        <span
                          role='img'
                          aria-label={`Severity ${a.severity}`}
                          className={cx(
                            'relative top-[2px] mr-2',
                            'h-4 w-4 rounded-full',
                            'inline-block',
                            a.findings.length <= 0
                              ? 'border border-corsha-brand-green bg-corsha-brand-green/25'
                              : 'border ' + severityToColor[a.severity],
                          )}
                        />
                        {a.title}
                      </Typography>
                    </a>
                  </li>
                ))}
              </ul>
            }
          </nav>
          <main className=''>
            <div className="mx-auto min-w-min px-4 sm:px-6 lg:px-8 my-4">
              <div className="my-12">
                <Typography variant="h1" className='text-5xl'>
                  Ongoing Results
                </Typography>
                <div className='flex flex-row space-y-0 items-center space-x-3 ml-1 pt-6'>
                  {summary ? (
                    <>
                      <Typography variant="h4" className='text-2xl'>
                        {summaryTitle}
                      </Typography>
                      <Typography style={{ color: theme.palette.text.secondary }} className='font-semibold'>
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

              <div className="flex flex-col space-y-12 mb-12">
                {analyses && analyses.length > 0 && analyses.map((a) => (
                  <AnalysisCard {...a} key={a.id}/>
                ))}
              </div>
            </div>
          </main>
        </div>
      </Layout>
    </>
  );
}
