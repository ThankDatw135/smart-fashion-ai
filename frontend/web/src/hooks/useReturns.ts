import { useQuery } from "@tanstack/react-query";
import { AdminReturnsAPI } from "@/services/returns.api";

export function useAdminReturns(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["admin-returns", params],
    queryFn: () => AdminReturnsAPI.getReturns(params),
  });
}
