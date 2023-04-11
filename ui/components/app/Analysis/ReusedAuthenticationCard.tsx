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

import React from 'react';
import {
  DataGrid,
  GridColDef,
} from '@mui/x-data-grid';

import { AnalysisOf, ReusedAuthentication } from '@/lib/findings';

import { AnalysisCard, CsvExportButton } from './core';

const columns: GridColDef[] = [
  { field: 'Secret', headerName: 'Secret', width: 400 },
  { field: 'Src IP', headerName: 'Src IP' },
  { field: 'URI', headerName: 'URI', width: 400 },
  { field: 'Dest IP', headerName: 'Dest IP' },
  { field: 'Dest Port', headerName: 'Dest Port' },
];

export const ReusedAuthenticationCard: React.FC<AnalysisOf<ReusedAuthentication>> = ({
  findings,
  reportedAt,
  ...otherProps
}) => {
  const data = (findings ?? []).flatMap((f) => (
    f.data.inRequests.map((rq) => ({
      id: `${f.data.auth}${JSON.stringify(rq)}`,
      'Secret': f.data.auth,
      'Src IP': rq.srcIp,
      'URI': rq.URI,
      'Dest IP': rq.destIp,
      'Dest Port': rq.destPort,
    }))
  ))
  return <AnalysisCard
    reportedAt={reportedAt}
    exportButton={<CsvExportButton
      stripID
      data={data}
      filename={`${reportedAt}-ReusedAuthentication.csv`}
    />}
    {...otherProps}
    noResults={data.length === 0}
  >
    <div style={{height: '400px', width: '100%'}}>
    <DataGrid
      rows={data}
      columns={columns}
      pageSize={10}
      rowsPerPageOptions={[10]}
    />
    </div>
  </AnalysisCard>
}
