import {
  Analysis as AnalysisType,
  AnalysisOf,
  ExpiredJWT,
  ReusedAuthentication,
  PasswordInURL,
  UseOfBasicAuth,
} from '@/lib/findings';
import { KubesecFinding } from '@/lib/analysis/kubesec-types';

import { logger } from '@/lib/internal';
import { PasswordInURLCard } from './PasswordInURLCard';
import { ExpiredJWTCard } from './ExpiredJWTCard';
import { ReusedAuthenticationCard } from './ReusedAuthentication';
import { UseOfBasicAuthCard } from './UseOfBasicAuthCard';
import { KubesecCard } from './KubesecCard';

export { AnalysisCardLoading } from './core';

export const Analysis: React.FC<AnalysisType> = (analysis) => {
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
      case 'pass-in-url': {
        const data = AnalysisOf(PasswordInURL).parse(analysis);
        return <PasswordInURLCard {...data} />
      }
      case 'use-of-basic-auth': {
        const data = AnalysisOf(UseOfBasicAuth).parse(analysis);
        return <UseOfBasicAuthCard {...data} />
      }
      case 'cast-kubesec': {
        const data = AnalysisOf(KubesecFinding).parse(analysis);
        return <KubesecCard {...data} />
      }
    }
  } catch (error) {
    logger.error({error}, 'error rendering card');
  }
  return <p>Error</p>;
}
