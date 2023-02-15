import { Analysis as AnalysisType } from '@/lib/findings';
import { ReusedAuthenticationCard } from './ReusedAuthentication';
import { UseOfBasicAuthCard } from './UseOfBasicAuthCard';

export const Analysis: React.FC<AnalysisType> = (analysis) => {
  switch (analysis.id) {
    case 'reused-auth': {
      return <ReusedAuthenticationCard {...analysis as AnalysisType<'reused-auth'>}/>
    }
    case 'use-of-basic-auth': {
      return <UseOfBasicAuthCard {...analysis as AnalysisType<'use-of-basic-auth'>}/>
    }
    default:
      return <p>Error</p>
  }
}
