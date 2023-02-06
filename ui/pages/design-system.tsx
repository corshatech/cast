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
        <main className="bg-gray-100 px-16 w-screen">
          <TypographySection />
          <ButtonSection />
          <ColorSection />
          <IconSection />
        </main>
      </Layout>
    </>
  );
};

export default DesignSystem;
