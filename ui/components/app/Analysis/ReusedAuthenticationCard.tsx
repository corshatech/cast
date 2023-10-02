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
import LocationOffIcon from '@mui/icons-material/LocationOff';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';

import { AnalysisOf, GeoDist, GeoIP, LocationDatum, ReusedAuthentication } from '@/lib/findings';

import { AnalysisCard, CsvExportButton } from './core';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Link from 'next/link';
import { Box } from '@mui/material';

// Severity of geoip distance in kilometers
const CRITICAL_SEVERITY_DISTANCE = 1000;
const HIGH_SEVERITY_DISTANCE = 100;

type InRequestRow = {
  id: string;
  'Secret': string;
  'Src IP': string;
  'URI': string | undefined;
  'Dest IP': string;
  'Dest Port': string;
}

type RequestData = {
  request: InRequestRow;
  geoIP: { 
    geoLocation: LocationDatum[] | undefined;
    maxDist: GeoDist | undefined;
  } | undefined;
}

const distanceToTooltipDescription = (dist: number) => (
  dist > 1000 ? 'Requests found at least 1000km apart (Click to view)' :
    dist > 100 ? 'Requests found at least 100km apart (Click to view)' :
      'View location data for requests'
)

const distanceToSeverityColor = (dist: number) => 
  dist > CRITICAL_SEVERITY_DISTANCE ? 'error' :
    dist > HIGH_SEVERITY_DISTANCE ? 'warning' 
      : 'success';

const Row = ({row}: {row: RequestData}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TableRow>
        <TableCell>
          <div className='flex justify-center'>
            {row.geoIP?.geoLocation?.length && row.geoIP.maxDist?.dist
             && row.geoIP.geoLocation.length > 0 ?
              <Tooltip
                title={distanceToTooltipDescription(row.geoIP.maxDist.dist)}
                placement="top"
              >
                <IconButton
                  aria-label="expand row"
                  size="small"
                  color={distanceToSeverityColor(row.geoIP.maxDist.dist)}
                  onClick={() => setOpen(!open)}
                >
                  {/* {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />} */}
                    <LocationOnIcon/>
                    {/* {row.geoIP.maxDist.dist} */}
                </IconButton>
              </Tooltip>
              : 
              <Tooltip placement="top" title="No location data for this request">
                <IconButton>
                    <LocationOffIcon/>
                </IconButton>
              </Tooltip>
            }
          </div>
        </TableCell>
        <TableCell>{row.request['Secret']}</TableCell>
        <TableCell>{row.request['Src IP']}</TableCell>
        <TableCell>{row.request['URI']}</TableCell>
        <TableCell>{row.request['Dest IP']}</TableCell>
        <TableCell>{row.request['Dest Port']}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <TableContainer component={Paper}>
              <Table aria-label="collapsible table">
                <TableHead>
                  <TableRow>
                    <TableCell>Source IP</TableCell>
                    <TableCell>Latitude (degrees)</TableCell>
                    <TableCell>Longitude (degrees)</TableCell>
                    <TableCell>
                      <Link href="https://www.iso.org/iso-3166-country-codes.html">
                        ISO Country Code
                      </Link>
                    </TableCell>
                    <TableCell>Error (km)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.geoIP?.geoLocation?.map(geoIPDatum => (
                    <TableRow key={geoIPDatum.src}>
                      <TableCell>{geoIPDatum.src}</TableCell>
                      <TableCell>{geoIPDatum.lat}</TableCell>
                      <TableCell>{geoIPDatum.long}</TableCell>
                      <TableCell>{geoIPDatum.country}</TableCell>
                      <TableCell>{geoIPDatum.error}</TableCell>
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
        'Src IP': rq.srcIp,
        'URI': rq.URI,
        'Dest IP': rq.destIp,
        'Dest Port': rq.destPort,
      },
      geoIP: {
        geoLocation: f.data.geoIP?.geoLocation.filter(i => i.id === rq.id),
        maxDist: f.data.geoIP?.maxDist,
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
            <TableCell/>
            <TableCell>Secret</TableCell>
            <TableCell>Src IP</TableCell>
            <TableCell>URI</TableCell>
            <TableCell>Dest IP</TableCell>
            <TableCell>Dest Port</TableCell>
          </TableRow>
        </TableHead>
        <TableBody className='overflow-scroll'>
          {data.map((data) => (
            <Row key={data.request.id} row={data} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </AnalysisCard>
}
