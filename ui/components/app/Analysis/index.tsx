import { Analysis as AnalysisType } from '@/lib/findings';
import { ReusedAuthenticationCard } from './ReusedAuthentication';

export const Analysis: React.FC<AnalysisType> = (analysis) => {
  switch (analysis.id) {
    case 'reused-auth': {
      return <ReusedAuthenticationCard {...analysis as AnalysisType<'reused-auth'>}/>
    }
    default:
      return <p>Error</p>
  }
}
