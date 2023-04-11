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

import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

import { FormattedDate } from '@/components/atoms/FormattedDate';
import { KubesecFinding } from '@/lib/analysis/kubesec-types';
import { AnalysisOf } from '@/lib/findings';

import { AnalysisCard, CsvExportButton } from './core';

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
