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

import { AnalysisOf, ExpiredJWT } from '@/lib/findings';
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
  { field: 'JWT', headerName: 'JWT', width: 400 },
  {
    field: 'Expired At',
    headerName: 'Expired At',
    renderCell(params: GridRenderCellParams<string>) {
      return params.value && <FormattedDate when={params.value}/>
    },
    width: 200,
  },
  { field: 'URI', headerName: 'URI', width: 400 },
  {
    field: 'Src IP',
    headerName: 'Source IP',
    width: 175,
    renderCell(params: GridRenderCellParams<string>) {
      return (
        <IPAddress
          className='mr-2'
          size={30}
          isoCode={params.row['Src Country Code']}
          lat={params.row['Src Latitude']}
          long={params.row['Src Longitude']}
          address={params.value ?? '-'}
        />
      )
    },
  },
  {
    field: 'Dest IP',
    headerName: 'Dest IP',
    width: 175,
    renderCell(params: GridRenderCellParams<string>) {
      return (
        <IPAddress
          className='mr-2'
          size={30}
          isoCode={params.row['Dest Country Code']}
          lat={params.row['Dest Latitude']}
          long={params.row['Dest Longitude']}
          address={params.value ?? '-'}
        />
      )
    },
  },
  { field: 'Dest Port', headerName: 'Dest Port' },
];

export const ExpiredJWTCard: React.FC<AnalysisOf<ExpiredJWT>> = ({
  findings,
  reportedAt,
  ...otherProps
}) => {
  const data = (findings ?? []).map(({
    data: {
      expiredAt,
      jwt,
      inRequest: {
        at,
        srcIp,
        srcCountryCode,
        srcLat,
        srcLong,
        URI,
        destIp,
        destCountryCode,
        destLat,
        destLong,
        destPort,
      },
    },
  }) => ({
    id: `${jwt}${at}${expiredAt}${srcIp}${URI}${destPort}`,
    'Timestamp': at,
    'JWT': jwt,
    'Expired At': expiredAt,
    'Src IP': srcIp,
    'Src Country Code': srcCountryCode,
    'Src Latitude': srcLat,
    'Src Longitude': srcLong,
    'URI': URI,
    'Dest IP': destIp,
    'Dest Country Code': destCountryCode,
    'Dest Latitude': destLat,
    'Dest Longitude': destLong,
    'Dest Port': destPort,
  }))
  return <AnalysisCard
    reportedAt={reportedAt}
    exportButton={<CsvExportButton
      stripID
      data={data}
      filename={`${reportedAt}-ExpiredJWTFindings.csv`}
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
