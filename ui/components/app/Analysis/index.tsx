import {
  Analysis as AnalysisType,
  AnalysisOf,
  ExpiredJWT,
  ReusedAuthentication,
  PasswordInURL,
  UseOfBasicAuth,
} from '@/lib/findings';
import { PasswordInURLCard } from './PasswordInURLCard';
import { ExpiredJWTCard } from './ExpiredJWTCard';
import { ReusedAuthenticationCard } from './ReusedAuthentication';
import { UseOfBasicAuthCard } from './UseOfBasicAuthCard';

export { AnalysisCardLoading } from './core';

export const Analysis: React.FC<AnalysisType> = (analysis) => {
  switch (analysis.id) {
    case 'expired-jwt': {
      return <ExpiredJWTCard {...analysis as AnalysisOf<ExpiredJWT>} />
    }
    case 'reused-auth': {
      return <ReusedAuthenticationCard {...analysis as AnalysisOf<ReusedAuthentication>} />
    }
    case 'pass-in-url': {
      return <PasswordInURLCard {...analysis as AnalysisOf<PasswordInURL>} />
    }
    case 'use-of-basic-auth': {
      return <UseOfBasicAuthCard {...analysis as AnalysisOf<UseOfBasicAuth>}/>
    }
    default:
      return <p>Error</p>
  }
}
