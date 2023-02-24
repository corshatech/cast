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
  { field: 'Src IP', headerName: 'Src IP' },
  { field: 'URI', headerName: 'URI', width: 400 },
  { field: 'Dest IP', headerName: 'Dest IP' },
  { field: 'Dest Port', headerName: 'Dest Port' },
];

export const UseOfBasicAuthCard: React.FC<Analysis<'use-of-basic-auth'>> = ({
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
    id: `${at}${srcIp}${URI}${destPort}`,
    'Timestamp': at,
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
      filename={`${reportedAt}-UseOfBasicAuth.csv`}
    />}
    {...otherProps}
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
