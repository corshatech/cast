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

import { Analysis, AnalysisOf, ExpiredJWT } from '../findings';
import conn from '../db';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import { KubesecFinding, kubesecRowToFinding, KubesecSQLRow } from './kubesec-types';

const lastCompletedJob = `
SELECT
  plugin_name as plugin,
  MAX(occurred_at) as at
FROM plugins_completions
WHERE plugin_name = 'cast-kubesec'
GROUP BY plugin_name
`;

const findingsQuery = `
SELECT
  id as id,
  plugin_name as type,
  occurred_at as detectedAt,
  data
FROM plugins_findings
WHERE plugin_name = 'cast-kubesec'
ORDER BY occurred_at DESC
`;

async function getLastCompletedJob(): Promise<string> {
  const { rows } = await conn.query(lastCompletedJob, []);
  if (rows.length !== 1) {
    throw new TypeError('Expected exactly one result from Kubesec completion query');
  }
  if (rows[0].plugin !== 'cast-kubesec') {
    throw new TypeError('Expected resulting plugin to be cast-kubesec');
  }
  if (!(rows[0].at instanceof Date)) {
    throw new TypeError('Expected a date for the timestamp');
  }
  return rows[0].at.toISOString();
}

async function query(): Promise<KubesecFinding[]> {
  const { rows } = await conn.query(findingsQuery, []);
  return rows.map(x => kubesecRowToFinding(KubesecSQLRow.parse(x)));
}

export async function kubesec(): Promise<AnalysisOf<KubesecFinding>> {
  // TODO: What to do when Kubesec plugin hasn't run yet...?
  // That's not the same thing as `findings: []`
  const findings = await query();
  const severity = findings.find(({severity}) => severity === 'critical') ? 'critical' : 'none';
  return {
    id: 'cast-kubesec',
    title: 'Kubesec',
    description: 'The Kubesec plugin scans your running Kubernetes cluster with kubesec.io, and reports the results here.',
    reportedAt: await getLastCompletedJob(),
    weaknessLink: 'https://kubesec.io/',
    severity,
    findings,
  };
}
