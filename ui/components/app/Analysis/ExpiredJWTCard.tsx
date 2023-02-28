import React from 'react';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';

import { Analysis } from '@/lib/findings';
import { AnalysisCard } from './core';
import { FormattedDate } from '@/components/atoms/FormattedDate';
import { CsvExportButton } from './core/CsvExportButton';

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
  { field: 'Src IP', headerName: 'Src IP' },
  { field: 'URI', headerName: 'URI', width: 400 },
  { field: 'Dest IP', headerName: 'Dest IP' },
  { field: 'Dest Port', headerName: 'Dest Port' },
];

export const ExpiredJWTCard: React.FC<Analysis<'expired-jwt'>> = ({
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
        URI,
        destIp,
        destPort,
      },
    },
  }) => ({
    id: `${jwt}${at}${expiredAt}${srcIp}${URI}${destPort}`,
    'Timestamp': at,
    'JWT': jwt,
    'Expired At': expiredAt,
    'Src IP': srcIp,
    'URI': URI,
    'Dest IP': destIp,
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
