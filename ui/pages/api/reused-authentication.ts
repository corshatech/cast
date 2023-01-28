/* Copyright 2022 Corsha.
   Licensed under the Apache License, Version 2.0 (the 'License');
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
        http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an 'AS IS' BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License. */

import { NextApiRequest, NextApiResponse } from 'next';
import conn from '../../libs/db';

export type AuthenticationUseRecord = {
  absoluteUri: string;
  srcIp: string;
};

export type AnalysisResponse = {
  reusedAuthentication: Record<string, AuthenticationUseRecord[]>;
};

const query = `
   SELECT DISTINCT
     data->'request'->'headers'->>'Authorization' as auth_header,
     data->'request'->>'absoluteUri' as absolute_uri,
     data->'src'->>'ip' as src_ip
   FROM traffic WHERE
   data->'request'->'headers'->>'Authorization' IN (
     SELECT
       data->'request'->'headers'->>'Authorization' as auth_header
     FROM traffic
     WHERE data->'request'->'headers'->>'Authorization' is not null
     GROUP BY auth_header
     HAVING count(distinct data->'src'->>'ip') > 1
   )
   `;

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<AnalysisResponse>,
) => {
  const result = await conn.query(query, []);

  const reusedAuthentication: AnalysisResponse['reusedAuthentication'] = {};

  result.rows.forEach(
    (row: { auth_header: string; absolute_uri: string; src_ip: string }) => {
      reusedAuthentication[row.auth_header] = [
        ...(reusedAuthentication[row.auth_header] ?? []),
        { absoluteUri: row.absolute_uri, srcIp: row.src_ip },
      ];
    },
  );

  res.status(200).json({ reusedAuthentication });
};

export default handler;
