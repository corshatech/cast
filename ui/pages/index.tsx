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
  const { data, isLoading, error } = useSWR<AnalysesResponse>('/api/analyses');
  const analysesResponse = data;

  const summary = !isLoading && analysesResponse && summarizeAnalyses(analysesResponse.analyses);
  const analyses = analysesResponse?.analyses ?? []
  const showLoadingState = error || isLoading;

  return (
    <>
      <Head>
        <title>Summary</title>
      </Head>
      <Layout>
        <Header />
        <main className="bg-gray-50 w-screen">
          {error && <Alert severity="error"> An Error Occurred loading analysis: {error.toString()} </Alert>}
          <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto">
              <div className="w-full my-12 bg-slate-200 h-[400px] rounded-lg flex justify-center items-center">
                {summary && <Summary {...summary} />}
                {showLoadingState && <SummaryLoading />}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {(analyses.length > 0) && analyses.map((a) => <Analysis {...a} key={a.id} />)}
              {showLoadingState && <AnalysisGridLoading />}
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
}
