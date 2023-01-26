import useSWR from "swr";
import type { AnalysisResponse } from "@/pages/api/reused-authentication";
import { Button } from "@/components/index";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function FeatureComponent() {
  const { data, error } = useSWR<AnalysisResponse>(
    "/api/reused-authentication",
    fetcher
  );

  const loading = !data && !error;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div>
        <Button variant="lg">Click Me</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-3xl rounded-smd">A Title</div>
      <Button variant="lg">Click Me</Button>
    </div>
  );
}
