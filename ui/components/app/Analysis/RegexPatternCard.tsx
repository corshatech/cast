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

import { AnalysisOf, RegexPattern } from '@/lib/findings';
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
  { field: 'Src IP', headerName: 'Src IP' },
  { field: 'Dest IP', headerName: 'Dest IP' },
  { field: 'Dest Port', headerName: 'Dest Port' },
  { field: 'URI', headerName: 'URI', width: 400 },
];

// IDs for RegexPatternCard will be the pattern name, and will not fit within the Analysis names
export const RegexPatternCard: React.FC<Omit<AnalysisOf<RegexPattern>, 'id'> & {id: string}> = ({
  findings,
  reportedAt,
  ...otherProps
}) => {
  const data = (findings ?? []).map(({
    data: {
      inRequest: {
        at,
        srcIp,
        URI,
        destIp,
        destPort,
      },
    },
  }) => ({
    id: `${at}${srcIp}${destIp}${destPort}${URI}`,
    // each param in quotes, joined by commas into a list
    'Timestamp': at,
    'Src IP': srcIp,
    'URI': URI,
    'Dest IP': destIp,
    'Dest Port': destPort,
  }))
  return <AnalysisCard
    reportedAt={reportedAt}
    {...otherProps}
    exportButton={<CsvExportButton
      stripID
      data={data}
      filename={`${reportedAt}-${otherProps.id}.csv`}
    />}
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
