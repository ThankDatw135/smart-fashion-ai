import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CartAPI } from "@/services/cart.api";

// Lấy giỏ hàng
export function useCart() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => CartAPI.getCart(),
  });
}

// Thêm sản phẩm vào giỏ
export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { productId: string; variantId: string; quantity: number }) =>
      CartAPI.addToCart(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

// Cập nhật số lượng item trong giỏ
export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) =>
      CartAPI.updateCartItem(cartItemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

// Xóa item khỏi giỏ
export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartItemId: string) => CartAPI.removeCartItem(cartItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
