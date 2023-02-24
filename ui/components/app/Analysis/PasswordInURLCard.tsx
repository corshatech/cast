import React from 'react';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';

import { Analysis } from '@/lib/findings';
import { FormattedDate } from '@/components/atoms/FormattedDate';
import { AnalysisCard } from './core';
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
  { field: 'Query Param(s)', headerName: 'Query Param(s)', width: 300 },
  { field: 'Src IP', headerName: 'Src IP' },
  { field: 'Dest IP', headerName: 'Dest IP' },
  { field: 'Dest Port', headerName: 'Dest Port' },
  { field: 'URI', headerName: 'URI', width: 400 },
];

export const PasswordInURLCard: React.FC<Analysis<'pass-in-url'>> = ({
  findings,
  reportedAt,
  ...otherProps
}) => {
  const data = (findings ?? []).map(({
    data: {
      queryParams,
      inRequest: {
        at,
        srcIp,
        URI,
        destIp,
        destPort,
      },
    },
  }) => ({
    id: `${at}${srcIp}${destIp}${destPort}${URI}${queryParams}`,
    // each param in quotes, joined by commas into a list
    'Query Param(s)': queryParams.map(s => `"${s}"`).join(', '),
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
      filename={`${reportedAt}-PasswordsInURL.csv`}
    />}
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
