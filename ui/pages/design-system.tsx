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

import { Header } from '@/components/app/Header';
import { Layout } from '@/components/app/Layout';

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
