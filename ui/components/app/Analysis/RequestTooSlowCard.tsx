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
import { IPAddress } from '../IPAddress';

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
    headerName: 'Elapsed Time (s)',
    width: 175,
  },
  {
    field: 'Src IP',
    headerName: 'Source IP',
    width: 175,
    renderCell(params: GridRenderCellParams<string>) {
      return (
        <IPAddress
          className='mr-2'
          size={30}
          isoCode={params.row.srcCountryCode}
          lat={params.row.srcLat}
          long={params.row.srcLong}
          address={params.value ?? '-'}
        />
      )
    },
  },
  { field: 'Src Port', headerName: 'Src Port' },
  { field: 'URI', headerName: 'URI', width: 400 },
  {
    field: 'Dest IP',
    headerName: 'Dest IP',
    width: 175,
    renderCell(params: GridRenderCellParams<string>) {
      return (
        <IPAddress
            className='mr-2'
            size={30}
            isoCode={params.row.destCountryCode}
            lat={params.row.destLat}
            long={params.row.destLong}
            address={params.value ?? '-'}
        />
      )
    },
  },
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
        srcCountryCode,
        srcLat,
        srcLong,
        srcPort,
        URI,
        destIp,
        destCountryCode,
        destLat,
        destLong,
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
    srcCountryCode,
    srcLat,
    srcLong,
    'Src Port': srcPort,
    'Dest IP': destIp,
    destCountryCode,
    destLat,
    destLong,
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
