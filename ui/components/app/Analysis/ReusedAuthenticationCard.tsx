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
import {LocationOn, Public, ExpandLess, ExpandMore} from '@mui/icons-material';
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

import { AnalysisOf, LocationDatum, ReusedAuthentication } from '@/lib/findings';

import { AnalysisCard, CsvExportButton } from './core';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { FormattedDate } from '@/components/atoms/FormattedDate';

// Severity of geoip distance in kilometers
const CRITICAL_SEVERITY_DISTANCE = 1000;
const HIGH_SEVERITY_DISTANCE = 100;

type InRequestRow = {
  id: string;
  'Secret': string;
  'URI': string | undefined;
  'Count': number;
}

type RequestData = {
  request: InRequestRow;
  geoIP: { 
    geoLocation: LocationDatum[] | undefined;
    maxDist: number | undefined;
    maxError: number | undefined;
  } | undefined;
}

const distanceToDescription = (dist: number) => (
  dist > CRITICAL_SEVERITY_DISTANCE ? 'Requests found at least 1000km apart' :
    'Requests found at least 100km apart'
)

const distanceToSeverityColor = (dist: number) => 
  dist > CRITICAL_SEVERITY_DISTANCE ? 'error' :
    'warning'

const Row = ({row}: {row: RequestData}) => {
  const [open, setOpen] = useState(false);
  console.log(row)
  return (
    <>
      <TableRow>
        <TableCell>{row.request['Secret']}</TableCell>
        <TableCell>{row.request['URI']}</TableCell>
        <TableCell>{row.request['Count']}</TableCell>
        <TableCell>
          <IconButton aria-label="expand row" onClick={() => setOpen(!open)}>
            {open ? 
              <ExpandLess/>
              : <ExpandMore/>
            }
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <div className='flex justify-center text-lg m-4'>
              {row.geoIP?.geoLocation?.length && row.geoIP.maxDist
                && row.geoIP.geoLocation.length > 0 ?

                row.geoIP.maxDist >= HIGH_SEVERITY_DISTANCE ?
                  <>
                    <LocationOn color={distanceToSeverityColor(row.geoIP.maxDist)}/>
                    <p>
                      {distanceToDescription(row.geoIP.maxDist)}
                    </p>
                  </>
                  : <></>
                : <></>
              }
            </div>
            <TableContainer component={Paper}>
              <Table aria-label="collapsible table">
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
                    <TableCell>
                      <a href="https://www.iso.org/iso-3166-country-codes.html">
                        ISO Country Code
                      </a>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.geoIP?.geoLocation?.map(geoIPDatum => (
                    <TableRow key={geoIPDatum.ipAddr}>
                      <TableCell>
                        <span className='truncate' title={geoIPDatum.trafficId}>
                          {geoIPDatum.trafficId}
                        </span>
                      </TableCell>
                      <TableCell><FormattedDate when={geoIPDatum.occurredAt} /></TableCell>
                      <TableCell>
                        <Chip 
                          color={geoIPDatum.direction == 'src' ? 'primary' : 'secondary'}
                          label={geoIPDatum.direction === 'src' ? 'Source' : 'Destination'}
                        />
                      </TableCell>
                      <TableCell>{geoIPDatum.ipAddr}</TableCell>
                      <TableCell>{geoIPDatum.uri}</TableCell>
                      <TableCell>{geoIPDatum.port}</TableCell>
                      <TableCell>{geoIPDatum.latitude ? (
                          <>
                            <Public className='mr-2'/>
                            {geoIPDatum.latitude + '° ' + geoIPDatum.longitude + '°'}
                          </>
                        ): '-'}</TableCell>
                      <TableCell>{geoIPDatum.error ?? '-'}</TableCell>
                      <TableCell>{geoIPDatum.countryCode ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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

    return f.data.inRequests.map((rq) => ({
      request: {
        id: `${f.data.auth}${JSON.stringify(rq)}`,
        'Secret': f.data.auth,
        'URI': rq.URI,
        'Count': rq.count,
      },
      geoIP: {
        geoLocation: f.data.geoIP?.geoLocation,
        maxDist: f.data.geoIP?.maxDist,
        maxError: f.data.geoIP?.maxError,
      },
    }))
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
            <Row key={data.request.Secret} row={data} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </AnalysisCard>
}
