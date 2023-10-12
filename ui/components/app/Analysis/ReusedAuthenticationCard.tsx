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

import React, { useState } from 'react';
import { LocationOn, Public, ExpandLess, ExpandMore } from '@mui/icons-material';
import { 
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

import { 
  AnalysisOf, 
  CRITICAL_SEVERITY_DISTANCE,
  HIGH_SEVERITY_DISTANCE, 
  ReusedAuthRequest, 
  ReusedAuthentication, 
} from '@/lib/findings';

import { AnalysisCard, CsvExportButton } from './core';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { FormattedDate } from '@/components/atoms/FormattedDate';

type InRequestRow = {
  id: string;
  'Secret': string;
  'URI': string | undefined;
  'Count': number;
  maxDist: number | undefined;
  maxError: number | undefined;
}

type RequestData = InRequestRow & { requests: ReusedAuthRequest[] };

const distanceToDescription = (dist: number) => (
  dist > CRITICAL_SEVERITY_DISTANCE ? 'Requests found at least 1000km apart' :
    'Requests found at least 100km apart'
)

const distanceToSeverityColor = (dist: number) => 
  dist > CRITICAL_SEVERITY_DISTANCE ? 'error' :
    'warning'

const RequestsTable = ({row}: {row: RequestData}) => (
  <TableContainer sx={{border: 1, borderColor: '#e5e7eb', borderRadius: '4px'}} component={Paper}>
    <Table sx={{padding: 4}} aria-label="collapsible table">
      <TableHead>
        <TableRow>
          <TableCell>Traffic ID</TableCell>
          <TableCell>Occurred At</TableCell>
          <TableCell>Direction</TableCell>
          <TableCell>IP Address</TableCell>
          <TableCell>URI</TableCell>
          <TableCell>Port</TableCell>
          <TableCell>Location (Lat, Long in degrees)</TableCell>
          <TableCell>Error (km)</TableCell>
          <TableCell>ISO Country Code</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {row.requests.map(request => (
          <TableRow key={request.trafficId + request.ipAddr}>
            <TableCell title={request.trafficId}>
              {request.trafficId}
            </TableCell>
            <TableCell><FormattedDate when={request.at} /></TableCell>
            <TableCell>
              <Chip 
                color={request.direction === 'src' ? 'primary' : 'secondary'}
                label={request.direction === 'src' ? 'Source' : 'Destination'}
              />
            </TableCell>
            <TableCell>{request.ipAddr}</TableCell>
            <TableCell>{row.URI}</TableCell>
            <TableCell>{request.port}</TableCell>
            <TableCell>{request.latitude ? (
                <>
                  <Public className='mr-2'/>
                  {`${request.latitude}° ${request.longitude}°`}
                </>
              ): '-'}</TableCell>
            <TableCell>{request.error ?? '-'}</TableCell>
            <TableCell>{request.countryCode ?? '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
)

const Row = ({row}: {row: RequestData}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TableRow>
        <TableCell>{row['Secret']}</TableCell>
        <TableCell>{row['URI']}</TableCell>
        <TableCell>{row['Count']}</TableCell>
        <TableCell>
          <IconButton aria-label="expand row" onClick={() => setOpen((isOpen) => !isOpen)}>
            {open ? 
              <ExpandLess/>
              : <ExpandMore/>
            }
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ padding: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <div className='p-4'>
              {row.maxDist && row.maxDist >= HIGH_SEVERITY_DISTANCE &&
                <>
                  <p className='flex items-center justify-center text-lg mb-4'>
                    <LocationOn color={distanceToSeverityColor(row.maxDist)}/>
                    {distanceToDescription(row.maxDist)}
                  </p>
                </>
              }
              <RequestsTable row={row}/>
            </div>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
    
  )
}

export const ReusedAuthenticationCard: React.FC<AnalysisOf<ReusedAuthentication>> = ({
  findings,
  reportedAt,
  ...otherProps
}) => {
  const data: RequestData[] = (findings ?? []).flatMap((f) => {
    return ({
      id: `${f.data.auth}${JSON.stringify(f.data.requests)}`,
      'Secret': f.data.auth,
      'URI': f.data.uri,
      'Count': f.data.count,
      maxDist: f.data.maxDist,
      maxError: f.data.maxError,
      requests: f.data.requests,
    })
  })
  
  return <AnalysisCard
    reportedAt={reportedAt}
    exportButton={<CsvExportButton
      stripID
      data={data}
      filename={`${reportedAt}-ReusedAuthentication.csv`}
    />}
    {...otherProps}
    noResults={data.length === 0}
  >
    <TableContainer sx={{ maxHeight: 400, border: 1, borderColor: '#e5e7eb', borderRadius: '4px' }}>
      <Table stickyHeader aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell>Secret</TableCell>
            <TableCell>URI</TableCell>
            <TableCell>Count</TableCell>
            <TableCell/>
          </TableRow>
        </TableHead>
        <TableBody className='overflow-scroll'>
          {data.map((data) => (
            <Row key={data.Secret} row={data} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </AnalysisCard>
}
