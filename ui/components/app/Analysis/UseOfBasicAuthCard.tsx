import React from 'react';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';

import { Analysis } from '@/lib/findings';
import { AnalysisCard } from './core';
import { FormattedDate } from '@/components/atoms/FormattedDate';

const columns: GridColDef[] = [
  {
    field: 'at',
    headerName: 'Timestamp',
    renderCell(params: GridRenderCellParams<string>) {
      return params.value && <FormattedDate when={params.value}/>
    },
    width: 200,
  },
  { field: 'srcIp', headerName: 'Src IP' },
  { field: 'URI', headerName: 'URI', width: 400 },
  { field: 'destIp', headerName: 'Dest IP' },
  { field: 'destPort', headerName: 'Dest Port' },
];

export const UseOfBasicAuthCard: React.FC<Analysis<'use-of-basic-auth'>> = ({
  findings,
  ...otherProps
}) => {
  return <AnalysisCard {...otherProps} noResults={(findings ?? []).length === 0}>
    <div style={{height: '400px', width: '100%'}}>
    <DataGrid
      rows={(findings ?? []).map(({
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
