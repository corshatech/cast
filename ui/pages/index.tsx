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
import { Alert } from '@mui/material';

import type { AnalysesResponse } from '@/pages/api/analyses';
import { AnalysisCard, AnalysisCardLoading } from '@/components/app/Analysis';
import { Header } from '@/components/app/Header';
import { Layout } from '@/components/app/Layout';
import { Summary, SummaryLoading } from '@/components/app/Summary';
import { summarizeAnalyses } from '@/lib/findings';

const AnalysisGridLoading = () => {
  return (<>
    <AnalysisCardLoading />
    <AnalysisCardLoading />
    <AnalysisCardLoading />
    <AnalysisCardLoading />
  </>);
}
export default function Dashboard() {
  const { data: analysesResponse, error } = useSWR<AnalysesResponse>('/api/analyses');

  const summary =
    analysesResponse &&
    summarizeAnalyses(analysesResponse.analyses);
  const analyses = analysesResponse?.analyses ?? [];

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
          <div className="max-w-screen 2xl:max-4K:max-w-10xl  mx-auto px-4 sm:px-6 lg:px-8">
            <div className="my-12">
              {summary ? <Summary {...summary} /> : <SummaryLoading />}
            </div>

            <div className="flex flex-col 4K:grid 4K:grid-cols-2 space-y-12 4K:space-y-0 4K:gap-4 mb-12">
              {analyses.length > 0 ? (
                analyses.map((a) => <AnalysisCard {...a} key={a.id} />)
              ) : (
                <AnalysisGridLoading />
              )}
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
}
