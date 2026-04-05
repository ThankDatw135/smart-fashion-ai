import { api, USE_MOCK } from "./api";
import { CartResponse } from "@/types/cart";
import { ApiResponse } from "@/types/api";
import { MOCK_CART } from "@/mocks/cart.mock";

export const CartAPI = {
  // GET /cart (matches BE: GET /cart — uses JWT or X-Guest-Id header)
  getCart: async (): Promise<ApiResponse<CartResponse>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Success", data: MOCK_CART, timestamp: new Date().toISOString()
      }), 500));
    }
    const res = await api.get<ApiResponse<CartResponse>>("/cart");
    return res.data;
  },

  // POST /cart/items (H1 fix: was /cart/add, backend uses POST /cart/items)
  addToCart: async (payload: { productId: string; variantId: string; quantity: number }): Promise<ApiResponse<CartResponse>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 201, message: "Added to cart", data: MOCK_CART, timestamp: new Date().toISOString()
      }), 500));
    }
    const res = await api.post<ApiResponse<CartResponse>>("/cart/items", payload);
    return res.data;
  },

  // PUT /cart/items/:variantId (H1 fix: was PATCH, backend uses PUT with variantId not cartItemId)
  updateCartItem: async (variantId: string, quantity: number): Promise<ApiResponse<CartResponse>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Cart updated", data: MOCK_CART, timestamp: new Date().toISOString()
      }), 300));
    }
    const res = await api.put<ApiResponse<CartResponse>>(`/cart/items/${variantId}`, { quantity });
    return res.data;
  },

  // DELETE /cart/items/:variantId (H1 fix: param is variantId)
  removeCartItem: async (variantId: string): Promise<ApiResponse<CartResponse>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Item removed", data: { items: [], subtotal: 0, totalQuantity: 0 }, timestamp: new Date().toISOString()
      }), 300));
    }
    const res = await api.delete<ApiResponse<CartResponse>>(`/cart/items/${variantId}`);
    return res.data;
  },

  // POST /cart/merge (merge guest cart → user cart after login)
  mergeCart: async (): Promise<ApiResponse<CartResponse>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Cart merged", data: MOCK_CART, timestamp: new Date().toISOString()
      }), 400));
    }
    const res = await api.post<ApiResponse<CartResponse>>("/cart/merge");
    return res.data;
  }
};
