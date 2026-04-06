import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VouchersAPI } from "@/services/vouchers.api";

export function useVouchers(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["vouchers", params],
    queryFn: () => VouchersAPI.getPublicVouchers(params), // Mocks get public vouchers normally but we will use it for admin for now or we need an admin API. Admin usually fetches all vouchers. Based on VouchersAPI, we only have getPublicVouchers. Wait, "getPublicVouchers" calls /vouchers. Let's just use it to get the list.
  });
}
