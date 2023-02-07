import { Header, Layout } from '@/components';
import Head from 'next/head';
import {
  TypographySection,
  ButtonSection,
  ColorSection,
  IconSection,
} from '@/components/app/page-sections';

export const DesignSystem = () => {
  return (
    <>
      <Head>
        <title>Cast Design System</title>
      </Head>
      <Layout>
        <Header />
        <main className="bg-gray-50 w-screen">
          <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8">
            <TypographySection />
            <ButtonSection />
            <ColorSection />
            <IconSection />
          </div>
        </main>
      </Layout>
    </>
  );
};

export default DesignSystem;
