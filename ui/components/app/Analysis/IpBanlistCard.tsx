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
   import { AnalysisOf, IpBanlist } from '@/lib/findings';

   import { AnalysisCard, CsvExportButton } from './core';
   import { IPAddress } from '../IPAddress';

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
     { field: 'Matched Address', headerName: 'Matched Address', width: 150 },
     { field: 'Malware', headerName: 'Malware', width: 200 },
     { field: 'URI', headerName: 'URI', width: 400 },
     {
      field: 'Src IP',
      headerName: 'Source IP',
      width: 175,
      renderCell(params: GridRenderCellParams<string>) {
        return (
          <IPAddress
            className='mr-2'
            size={30}
            isoCode={params.row['Src Country Code']}
            lat={params.row['Src Latitude']}
            long={params.row['Src Longitude']}
            address={params.value ?? '-'}
          />
        )
      },
    },
    {
      field: 'Dest IP',
      headerName: 'Dest IP',
      width: 175,
      renderCell(params: GridRenderCellParams<string>) {
        return (
          <IPAddress
            className='mr-2'
            size={30}
            isoCode={params.row['Dest Country Code']}
            lat={params.row['Dest Latitude']}
            long={params.row['Dest Longitude']}
            address={params.value ?? '-'}
          />
        )
      },
    },
   ];

   export const IpBanlistCard: React.FC<AnalysisOf<IpBanlist>> = ({
     findings,
     reportedAt,
     ...otherProps
   }) => {
     const data = findings.map(({
       occurredAt,
       severity,
       data: {
        malware,
        country,
        specificAddress,
        inRequest,
       },
     }) => ({
       'Timestamp': (!!occurredAt && 'at' in occurredAt) ? occurredAt.at : '',
       Severity: severity,
       'Matched Address': specificAddress,
       Malware: malware,
       Country: country,
       URI: inRequest?.URI ?? '',
       'Src IP': inRequest.srcIp,
       'Src Country Code': inRequest.srcCountryCode,
       'Src Latitude': inRequest.srcLat,
       'Src Longitude': inRequest.srcLong,
       'Dest IP': inRequest.destIp,
       'Dest Country Code': inRequest.destCountryCode,
       'Dest Latitude': inRequest.destLat,
       'Dest Longitude': inRequest.destLong,
     }));
     return <AnalysisCard
       reportedAt={reportedAt}
       exportButton={<CsvExportButton
         data={data}
         filename={`${reportedAt}-IP-BanlistFindings.csv`}
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
