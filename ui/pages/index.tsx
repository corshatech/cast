import { Header } from '@/components/app/Header/Header';
import { Layout, Summary } from '@/components/index';
import Head from 'next/head';
import { AnalysesResponse } from './api/analyses';
import useSWR from 'swr';
import { summarizeAnalyses } from 'lib/findings';

export default function Dashboard() {
  const { data, isLoading, error } = useSWR<AnalysesResponse>('/api/analyses');
  const analysesResponse = data;

  if (isLoading) {
    // TODO: do something with isLoading
  }

  if (error) {
    // TODO: do something with the error
  }

  const summary = !isLoading && analysesResponse && summarizeAnalyses(analysesResponse.analyses);

  return (
    <>
      <Head>
        <title>Summary</title>
      </Head>
      <Layout>
        <Header />
        <main className="bg-gray-50 w-screen">
          <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto">
              <div className="w-full my-12 bg-slate-200 h-[400px] rounded-lg flex justify-center items-center">
                {summary && <Summary {...summary} />}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="w-full bg-slate-200 h-[400px] rounded-lg flex justify-center items-center">
                Table 1
              </div>
              <div className="w-full bg-slate-200 h-[400px] rounded-lg flex justify-center items-center">
                Table 2
              </div>
              <div className="w-full bg-slate-200 h-[400px] rounded-lg flex justify-center items-center">
                Table 3
              </div>
              <div className="w-full bg-slate-200 h-[400px] rounded-lg flex justify-center items-center">
                Table 4
              </div>
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
}
