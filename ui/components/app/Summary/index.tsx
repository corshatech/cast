import useSWR from 'swr';
import type { AnalysesResponse } from '@/pages/api/analyses';
import { Roarr } from 'roarr';

export const Summary = () => {
  const { isLoading, error } = useSWR<AnalysesResponse>('/api/analyses', {
    onSuccess(data) {
      Roarr.info(JSON.stringify(data));
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error</div>;
  }

  return <div>Summary</div>;
};
