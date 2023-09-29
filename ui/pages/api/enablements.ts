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

import type { NextApiRequest } from 'next';

import { TypedAPIResponse } from '@/lib/internal';
import { CASTFeaturesListing } from '@/lib/metadata';

import { conn } from '../../lib/db';

const hasGeoIPDataQuery = `SELECT COUNT(*) > 0 as on FROM geo_ip_data;`;
const hasGeoLocationDataQuery = `SELECT COUNT(*) > 0 as on FROM geo_location_data;`;
const hasFeodoDataQuery = `SELECT COUNT(*) > 0 as on FROM feodo_banlist;`;

const handler = async (_req: NextApiRequest, res: TypedAPIResponse<CASTFeaturesListing>) => {
  try {
    const geoIpEnabled = 
      (await conn.query(hasGeoIPDataQuery)).rows[0].on 
      && (await conn.query(hasGeoLocationDataQuery)).rows[0].on;
    const feodoEnabled = (await conn.query(hasFeodoDataQuery)).rows[0].on;

    res.status(200).json({
      geoIpEnabled,
      feodoEnabled,
    });
  } catch (e) {
    console.error(e)
    res.status(500).send({error: 'Internal server error'})
  }
};

export default handler;
