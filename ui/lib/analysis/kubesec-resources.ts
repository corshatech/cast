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

   import { AnalysisOf } from '../findings';
   import { conn } from '../db';
   import { KubesecResourcesFinding, kubesecResourcesRowToFinding, KubesecResourcesSQLRow, kubesecResourcesRules } from './kubesec-types';

   const lastCompletedJob = `
   SELECT
     REPLACE(plugin_name, 'cast-kubesec', 'cast-kubesec-resources') as plugin,
     MAX(occurred_at) as at
   FROM plugins_completions
   WHERE plugin_name = 'cast-kubesec'
   GROUP BY plugin_name
   `;
   
   const findingsQuery = `
   SELECT
     id as id,
     REPLACE(plugin_name, 'cast-kubesec', 'cast-kubesec-resources') as type,
     occurred_at as detectedAt,
     data
   FROM plugins_findings
   WHERE 
     plugin_name = 'cast-kubesec' and 
     data->>'Rule ID' IN ('${kubesecResourcesRules.join('\', \'')}')
   ORDER BY occurred_at DESC
   `;
   
   async function getLastCompletedJob(): Promise<string> {
     const { rows } = await conn.query(lastCompletedJob, []);
     if (rows.length !== 1) {
       throw new TypeError('Expected exactly one result from Kubesec completion query');
     }
     if (rows[0].plugin !== 'cast-kubesec-resources') {
       throw new TypeError('Expected resulting plugin to be cast-kubesec-resources');
     }
     if (!(rows[0].at instanceof Date)) {
       throw new TypeError('Expected a date for the timestamp');
     }
     return rows[0].at.toISOString();
   }
   
   async function query(): Promise<KubesecResourcesFinding[]> {
     const { rows } = await conn.query(findingsQuery, []);
     return rows.map(x => kubesecResourcesRowToFinding(KubesecResourcesSQLRow.parse(x)));
   }
   
   export async function kubesecResources(): Promise<AnalysisOf<KubesecResourcesFinding>[]> {
     const findings = await query();
     const severity = findings.find(({severity}) => severity === 'critical') ? 'critical' : 'medium';
     return [{
       id: 'cast-kubesec-resources',
       title: 'Kubesec: Unrestricted Resource Consumption',
       description: 'Kubernetes resources were detected having limits or ' +
       'requests that are misconfigured. Resource limits that do not ' +
       'effectively prevent excessive load on the API can result in increased ' + 
       'operational costs and resource starvation. Set the proper requests ' +
       'and limits for all Pods, Deployments, StatefulSets and DaemonSets.',
       reportedAt: await getLastCompletedJob(),
       weaknessTitle: '(OWASP) API4:2023 Unrestricted Resource Consumption',
       weaknessLink: 'https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/',
       severity,
       findings,
     }];
   }
   