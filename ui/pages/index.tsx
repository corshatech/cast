import Head from "next/head";

import { FeatureComponent } from "@/components/index";

export default function Dashboard() {
  return (
    <>
      <Head>
        <title>CAST Dashboard</title>
        <meta
          name="description"
          content="An overview of the most important events in your system"
        />
      </Head>
      <main>
        <h2 className="text-3xl text-blue-500" data-testid="title">
          CAST Dashboard
        </h2>
        <p>Lorem Ipsum blah blah blah</p>
        <FeatureComponent />
      </main>
    </>
  );
}
