import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

import { FormattedDate } from '@/components/atoms/FormattedDate';
import { KubesecFinding } from '@/lib/analysis/kubesec-types';
import { AnalysisOf } from '@/lib/findings';

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
  { field: 'Severity', headerName: 'Severity' },
  { field: 'Resource', headerName: 'Resource', width: 200 },
  { field: 'Namespace', headerName: 'Namespace' },
  { field: 'Rule ID', headerName: 'Rule ID' },
  { field: 'Selector', headerName: 'Selector', flex: 900 },
  { field: 'Reason', headerName: 'Reason', flex: 900 },
  { field: 'Points', headerName: 'Points' },
];

export const KubesecCard: React.FC<AnalysisOf<KubesecFinding>> = ({
  findings,
  reportedAt,
  ...otherProps
}) => {
  const data = findings.map(({
    detectedAt,
    data,
    severity,
  }) => ({
    'Timestamp': detectedAt,
    Severity: severity,
    ...data,
  }));
  return <AnalysisCard
    reportedAt={reportedAt}
    exportButton={<CsvExportButton
      data={data}
      filename={`${reportedAt}-KubesecFindings.csv`}
    />}
    {...otherProps}
    noResults={data.length === 0}
  >
    <div style={{ height: '400px', width: '100%' }}>
      <DataGrid
        rows={data}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10]}
        getRowId={(r) => JSON.stringify(r)}
      />
    </div>
  </AnalysisCard>
};
