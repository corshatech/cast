import React from 'react';
import {
  DataGrid,
  GridColDef,
} from '@mui/x-data-grid';

import { Analysis } from '@/lib/findings';
import { AnalysisCard } from './core';
import { CsvExportButton } from './core/CsvExportButton';

const columns: GridColDef[] = [
  { field: 'Secret', headerName: 'Secret', width: 400 },
  { field: 'Src IP', headerName: 'Src IP' },
  { field: 'URI', headerName: 'URI', width: 400 },
  { field: 'Dest IP', headerName: 'Dest IP' },
  { field: 'Dest Port', headerName: 'Dest Port' },
];

export const ReusedAuthenticationCard: React.FC<Analysis<'reused-auth'>> = ({
  findings,
  reportedAt,
  ...otherProps
}) => {
  const data = (findings ?? []).flatMap((f) => (
    f.data.inRequests.map((rq) => ({
      id: `${f.data.auth}${JSON.stringify(rq)}`,
      'Secret': f.data.auth,
      'Src IP': rq.srcIp,
      'URI': rq.URI,
      'Dest IP': rq.destIp,
      'Dest Port': rq.destPort,
    }))
  ))
  return <AnalysisCard
    reportedAt={reportedAt}
    exportButton={<CsvExportButton
      stripID
      data={data}
      filename={`${reportedAt}-ReusedAuthentication.csv`}
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
