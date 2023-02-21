import React from 'react';
import {
  DataGrid,
  GridColDef,
} from '@mui/x-data-grid';

const columns: GridColDef[] = [
  { field: 'secret', headerName: 'Secret', width: 400 },
  { field: 'srcIp', headerName: 'Src IP' },
  { field: 'uri', headerName: 'URI', width: 400 },
  { field: 'destIp', headerName: 'Dest IP' },
  { field: 'destPort', headerName: 'Dest Port' },
];

import { Analysis } from '@/lib/findings';
import { AnalysisCard } from './core';

export const ReusedAuthenticationCard: React.FC<Analysis<'reused-auth'>> = ({
  findings,
  ...otherProps
}) => {
  return <AnalysisCard {...otherProps} noResults={(findings ?? []).length === 0}>
    <div style={{height: '400px', width: '100%'}}>
    <DataGrid
      rows={(findings ?? []).flatMap((f) => (
        f.data.inRequests.map((rq) => ({
          id: `${f.data.auth}${JSON.stringify(rq)}`,
          secret: f.data.auth,
          srcIp: rq.srcIp,
          uri: rq.URI,
          destIp: rq.destIp,
          destPort: rq.destPort,
        }))
      ))}
      columns={columns}
      pageSize={10}
      rowsPerPageOptions={[10]}
    />
    </div>
  </AnalysisCard>
}
