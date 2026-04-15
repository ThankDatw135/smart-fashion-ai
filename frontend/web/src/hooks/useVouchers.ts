import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VouchersAPI } from "@/services/vouchers.api";

export function useVouchers(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["vouchers", params],
    queryFn: () => VouchersAPI.getPublicVouchers(params),
  });
}

export function useCreateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => VouchersAPI.createVoucher(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vouchers"] }),
  });
}

export function useUpdateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => VouchersAPI.updateVoucher(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vouchers"] }),
  });
}

export function useDeleteVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => VouchersAPI.deleteVoucher(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vouchers"] }),
  });
}

