import React from 'react';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';

import { Analysis } from '@/lib/findings';
import { FormattedDate } from '@/components/atoms/FormattedDate';
import { AnalysisCard } from './core';

const columns: GridColDef[] = [
  {
    field: 'at',
    headerName: 'Timestamp',
    renderCell(params: GridRenderCellParams<string>) {
      return params.value && <FormattedDate when={params.value}/>
    },
    width: 200,
  },
  { field: 'queryParams', headerName: 'Query Param(s)', width: 300 },
  { field: 'srcIp', headerName: 'Src IP' },
  { field: 'destIp', headerName: 'Dest IP' },
  { field: 'destPort', headerName: 'Dest Port' },
  { field: 'URI', headerName: 'URI', width: 400 },
];

export const PasswordInURLCard: React.FC<Analysis<'pass-in-url'>> = ({
  findings,
  ...otherProps
}) => {
  return <AnalysisCard {...otherProps} noResults={(findings ?? []).length === 0}>
    <div style={{height: '400px', width: '100%'}}>
    <DataGrid
      rows={(findings ?? []).map(({
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
        queryParams: queryParams.map(s => `"${s}"`).join(', '),
        at,
        srcIp,
        URI,
        destIp,
        destPort,
      }))}
      columns={columns}
      pageSize={10}
      rowsPerPageOptions={[10]}
    />
    </div>
  </AnalysisCard>
}
