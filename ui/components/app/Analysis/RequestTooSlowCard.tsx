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
  GridRenderCellParams,
} from '@mui/x-data-grid';

import { AnalysisOf, RequestTooSlow } from '@/lib/findings';
import { FormattedDate } from '@/components/atoms/FormattedDate';

import { AnalysisCard, CsvExportButton } from './core';

const columns: GridColDef[] = [
  {
    field: 'Timestamp',
    headerName: 'Timestamp',
    renderCell(params: GridRenderCellParams<string>) {
      return params.value && <FormattedDate when={params.value}/>
    },
    width: 200,
  },
  { field: 'Severity',
    headerName: 'Severity',
  },
  { field: 'Elapsed Time',
    headerName: 'Elapsed Time (ms)',
    width: 175,
  },
  { field: 'Src IP', headerName: 'Src IP' },
  { field: 'Src Port', headerName: 'Src Port' },
  { field: 'URI', headerName: 'URI', width: 400 },
  { field: 'Dest IP', headerName: 'Dest IP' },
  { field: 'Dest Port', headerName: 'Dest Port' },
];

export const RequestTooSlowCard: React.FC<AnalysisOf<RequestTooSlow>> = ({
  findings,
  reportedAt,
  ...otherProps
}) => {
  const data = (findings ?? []).map(({
    severity,
    data: {
      elapsedTime,
      inRequest: {
        at,
        srcIp,
        srcPort,
        URI,
        destIp,
        destPort,
      },
    },
  }) => ({
    id: `${at}${srcIp}${URI}${destPort}`,
    'Timestamp': at,
    'Elapsed Time': elapsedTime,
    'Severity': severity,
    URI,
    'Src IP': srcIp,
    'Src Port': srcPort,
    'Dest IP': destIp,
    'Dest Port': destPort,
  }))
  return <AnalysisCard
    reportedAt={reportedAt}
    exportButton={<CsvExportButton
      stripID
      data={data}
      filename={`${reportedAt}-RequestTooSlow.csv`}
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
