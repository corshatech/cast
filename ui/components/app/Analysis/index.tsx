import { Analysis as AnalysisType } from '@/lib/findings';
import { ExpiredJWTCard } from './ExpiredJWTCard';
import { ReusedAuthenticationCard } from './ReusedAuthentication';

export const Analysis: React.FC<AnalysisType> = (analysis) => {
  switch (analysis.id) {
    case 'expired-jwt': {
      return <ExpiredJWTCard {...analysis as AnalysisType<'expired-jwt'>} />
    }
    case 'reused-auth': {
      return <ReusedAuthenticationCard {...analysis as AnalysisType<'reused-auth'>}/>
    }
    default:
      return <p>Error</p>
  }
}
