import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BannersAPI } from "@/services/banners.api";

export function useBanners() {
  return useQuery({
    queryKey: ["banners"],
    queryFn: () => BannersAPI.getBanners(),
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => BannersAPI.createBanner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) => BannersAPI.updateBanner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
}
