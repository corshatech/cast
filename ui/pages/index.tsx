import { Header } from '@/components/app/Header/Header';
import { Layout } from '@/components/index';
import Head from 'next/head';
export default function Dashboard() {
  return (
    <>
      <Head>
        <title>Cast Design System</title>
      </Head>
      <Layout>
        <Header />
        <main className="bg-gray-100 px-16">
          <div>Summary</div>
          <div>Table 1</div>
          <div>Table 2</div>
          <div>Table 3</div>
          <div>Table 4</div>
        </main>
      </Layout>
    </>
  );
}
