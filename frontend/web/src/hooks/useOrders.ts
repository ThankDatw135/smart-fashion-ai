import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrdersAPI, CheckoutAPI } from "@/services/orders.api";

// Lấy danh sách đơn hàng của user
export function useMyOrders(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["orders", "me", params],
    queryFn: () => OrdersAPI.getMyOrders(params),
  });
}

// Lấy chi tiết đơn hàng theo ID
export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => OrdersAPI.getOrderById(id),
    enabled: !!id,
  });
}

// C4 fix: Checkout flow hooks — 4-step process
export function useInitCheckout() {
  return useMutation({
    mutationFn: (payload: { cartItemIds: string[] }) =>
      CheckoutAPI.initCheckout(payload),
  });
}

export function useSetCheckoutAddress() {
  return useMutation({
    mutationFn: ({ checkoutId, address }: { checkoutId: string; address: Record<string, any> }) =>
      CheckoutAPI.setAddress(checkoutId, address),
  });
}

export function useApplyCheckoutVoucher() {
  return useMutation({
    mutationFn: ({ checkoutId, voucherCode }: { checkoutId: string; voucherCode: string }) =>
      CheckoutAPI.applyVoucher(checkoutId, voucherCode),
  });
}

export function useConfirmCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checkoutId, paymentMethod }: { checkoutId: string; paymentMethod: string }) =>
      CheckoutAPI.confirmCheckout(checkoutId, paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

// Hủy đơn hàng
export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      OrdersAPI.cancelOrder(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
