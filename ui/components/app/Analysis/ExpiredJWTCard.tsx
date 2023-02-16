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
  { field: 'jwt', headerName: 'JWT', width: 400 },
  {
    field: 'expiredAt',
    headerName: 'Expired At',
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

export const ExpiredJWTCard: React.FC<Analysis<'expired-jwt'>> = ({
  findings,
  ...otherProps
}) => {
  return <AnalysisCard {...otherProps}>
    <div style={{height: '400px', width: '100%'}}>
    <DataGrid
      rows={(findings ?? []).map(({
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
        at,
        jwt,
        expiredAt,
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
