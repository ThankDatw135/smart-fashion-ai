import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VouchersAPI } from "@/services/vouchers.api";
import { Voucher } from "@/types/voucher";

// Lấy danh sách voucher công khai (trang chủ, trang vouchers)
export function usePublicVouchers(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["vouchers", "public", params],
    queryFn: () => VouchersAPI.getPublicVouchers(params),
  });
}

// Lấy voucher của user đã thu thập
export function useMyVouchers() {
  return useQuery({
    queryKey: ["vouchers", "me"],
    queryFn: () => VouchersAPI.getMyVouchers(),
  });
}

export function useCollectVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (voucherId: string) => VouchersAPI.collectVoucher(voucherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
    },
  });
}

export function useCreateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Voucher>) => VouchersAPI.createVoucher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
    },
  });
}

export function useUpdateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Voucher> }) => VouchersAPI.updateVoucher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
    },
  });
}
