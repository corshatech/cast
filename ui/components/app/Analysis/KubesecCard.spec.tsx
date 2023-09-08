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

   import { render } from '@testing-library/react';

   import { KubesecCard } from './KubesecCard';
   
   const reportedAt = new Date().toISOString();
   
   describe('KubesecCard', () => {
     it('renders all passed props', () => {
       const { asFragment } = render(<KubesecCard
         id="cast-kubesec-resources"
         title="Test title"
         description="Test description"
         reportedAt={reportedAt}
         severity="high"
         findings={[{
           type: 'cast-kubesec-resources',
           name: 'Test Finding 1',
           detectedAt: reportedAt,
           severity: 'medium',
           data: {
               Resource: 'deployments/test',
               Namespace: 'test-namespace',
               'Rule ID': 'LimitsMemory',
               Selector: 'containers[] .resources .limits .memory',
               Reason: 'Enforcing memory limits prevents DOS via resource exhaustion',
               Points: 1,
           },
         },
         {
            type: 'cast-kubesec',
            name: 'Test Finding 2',
            detectedAt: reportedAt,
            severity: 'medium',
            data: {
                Resource: 'deployments/test',
                Namespace: 'test-namespace',
                'Rule ID': 'ServiceAccountName',
                Selector: '.spec .serviceAccountName',
                Reason: 'Service accounts restrict Kubernetes API access and should be configured with least privilege',
                Points: 1,
            },
          }]}
       />);
       expect(asFragment()).toMatchSnapshot();
     });
   });
   