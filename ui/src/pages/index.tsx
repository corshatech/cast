/* Copyright 2022 Corsha.
   Licensed under the Apache License, Version 2.0 (the 'License');
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
        http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an 'AS IS' BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License. */

import type { NextPage } from "next";

import {
  Card,
  CardContent,
  Stack,
  Table,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import Head from "next/head";
import useSWR from "swr";

import type { AnalysisResponse, AuthenticationUseRecord } from "./api/reused-authentication";
import { DefaultLayout } from "layouts/DefaultLayout";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function ReusedAuthCard({ title, reuse }: {
  title: string;
  reuse: AuthenticationUseRecord[];
}) {
  // Something would have to be very wrong to display this placeholder default.
  let innerFrag = <Typography variant="body2">Error: data unavailable</Typography>;
  if (reuse.length > 0) {
    innerFrag = <Table>
      <TableHead>
        <TableCell>Absolute URI</TableCell>
        <TableCell>IP Address</TableCell>
      </TableHead>
      {reuse.map(({ absoluteUri, srcIp }) => (
        <TableRow key={absoluteUri + srcIp}>
          <TableCell>{absoluteUri}</TableCell>
          <TableCell>{srcIp}</TableCell>
        </TableRow>
      ))
      }
    </Table>;
  }

  return <Card>
    <CardContent>
      <Typography variant="h6" component="h3" gutterBottom>
        Authentication &quot;{title.substring(0, 8)}&quot;
        <Typography variant="body2" color="text.secondary">{title}</Typography>
      </Typography>
      {innerFrag}
    </CardContent>
  </Card>;
}

function ReusedAuthenticationList({ data }: {
  data: AnalysisResponse
}) {
  const result: React.ReactNode[] =
    Object
      .entries(data.reusedAuthentication)
      .map(([key, reuse]) => (<ReusedAuthCard key={key} title={key} reuse={reuse}></ReusedAuthCard>));
  if (result.length > 0) {
    return <Stack spacing={2}>{result}</Stack>;
  }
  return <Typography variant="body1">✅ No reused authentication detected</Typography>;
}

const Home: NextPage = () => {
  const { data, error } = useSWR<AnalysisResponse>("/api/reused-authentication", fetcher);

  return (
    <DefaultLayout>
      <Head>
        <title>CAST Dashboard</title>
        <meta name="description" content="Corsha CAST analysis tool" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Typography variant="h4" component="h2">Reused Authentication</Typography>
      {
        error
          ? <Typography variant="body1" color="error.main">{`${error}`}</Typography>
          : data
            ? <ReusedAuthenticationList data={data} />
            : <Typography variant="body1">Loading...</Typography>
      }
    </DefaultLayout>
  );
};

export default Home;
