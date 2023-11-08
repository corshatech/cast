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

import {
  Analysis,
  AnalysisOf,
  ExpiredJWT,
  ReusedAuthentication,
  UseOfBasicAuth,
  RequestTooSlow,
  IpBanlist,
  RegexFinding,
} from '@/lib/findings';
import { KubesecFinding, KubesecResourcesFinding } from '@/lib/analysis/kubesec-types';
import { logger } from '@/lib/internal';

import { RegexPatternCard } from './RegexPatternCard';
import { ExpiredJWTCard } from './ExpiredJWTCard';
import { ReusedAuthenticationCard } from './ReusedAuthenticationCard';
import { UseOfBasicAuthCard } from './UseOfBasicAuthCard';
import { RequestTooSlowCard } from './RequestTooSlowCard';
import { KubesecCard } from './KubesecCard';
import { IpBanlistCard } from './IpBanlistCard';

export { AnalysisCardLoading } from './core';

export const AnalysisCard: React.FC<Analysis> = (analysis) => {
  try {
    switch (analysis.id) {
      case 'expired-jwt': {
        const data = AnalysisOf(ExpiredJWT).parse(analysis)
        return <ExpiredJWTCard {...data} />
      }
      case 'reused-auth': {
        const data = AnalysisOf(ReusedAuthentication).parse(analysis);
        return <ReusedAuthenticationCard {...data} />
      }
      case 'regex-pattern': {
        const data = AnalysisOf(RegexFinding).parse(analysis);
        let id = 'regex-pattern-' + encodeURIComponent(data.findings[0].name);
        return <RegexPatternCard {...data} anchorId={id} />
      }
      case 'use-of-basic-auth': {
        const data = AnalysisOf(UseOfBasicAuth).parse(analysis);
        return <UseOfBasicAuthCard {...data} />
      }
      case 'request-too-slow': {
        const data = AnalysisOf(RequestTooSlow).parse(analysis);
        return <RequestTooSlowCard {...data} />
      }
      case 'cast-kubesec': {
        const data = AnalysisOf(KubesecFinding).parse(analysis);
        return <KubesecCard {...data} />
      }
      case 'cast-kubesec-resources': {
        const data = AnalysisOf(KubesecResourcesFinding).parse(analysis);
        return <KubesecCard {...data} />
      }
      case 'ip-banlist': {
        const data = AnalysisOf(IpBanlist).parse(analysis);
        return <IpBanlistCard {...data}/>
      }
    }
  } catch (error) {
    logger.error({error}, 'error rendering card');
  }
  return <p>Error</p>;
}
