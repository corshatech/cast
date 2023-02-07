import { Header } from '@/components/app/Header/Header';
import { Layout, Summary } from '@/components/index';
import Head from 'next/head';
export default function Dashboard() {
  return (
    <>
      <Head>
        <title>Cast Design System</title>
      </Head>
      <Layout>
        <Header />
        <main className="bg-gray-50 w-screen">
          <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto">
              <div className="w-full my-12 bg-slate-200 h-[400px] rounded-lg flex justify-center items-center">
                <Summary />
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
