import { useQuery } from "@tanstack/react-query";
import { AIAdminAPI } from "@/services/ai.api";

export function useAITrainingJobs(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["ai-training-jobs", params],
    queryFn: () => AIAdminAPI.getTrainingJobs(params),
  });
}
