import Head from 'next/head';
import Alert from '@mui/material/Alert';
import useSWR from 'swr';
import type { AnalysesResponse } from '@/pages/api/analyses';

import { Analysis, AnalysisCardLoading } from '@/components/app/Analysis';
import { Header } from '@/components/app/Header/Header';
import { Layout, Summary, SummaryLoading } from '@/components/index';
import { summarizeAnalyses } from 'lib/findings';

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
        <main className="bg-gray-100 w-screen">
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
                analyses.map((a) => <Analysis {...a} key={a.id} />)
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
