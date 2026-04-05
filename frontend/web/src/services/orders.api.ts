import { api, USE_MOCK } from "./api";
import { Order } from "@/types/order";
import { PaginatedResponse, ApiResponse } from "@/types/api";
import { MOCK_ORDERS } from "@/mocks/orders.mock";

/**
 * C4 FIX: Checkout Flow — matches backend's 4-step checkout
 * Backend flow: init → address → voucher → confirm
 */
export const CheckoutAPI = {
  // Step 1: POST /checkout/init — Initialize checkout from cart
  initCheckout: async (payload: { cartItemIds: string[] }): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 201, message: "Checkout initiated", 
        data: { checkoutId: "checkout_" + Date.now(), items: [], subtotal: 0 }, 
        timestamp: new Date().toISOString()
      }), 800));
    }
    const res = await api.post<ApiResponse<any>>("/checkout/init", payload);
    return res.data;
  },

  // Step 2: POST /checkout/:id/address — Set shipping address
  setAddress: async (checkoutId: string, address: Record<string, any>): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Address set", data: { checkoutId, shippingFee: 35000 }, timestamp: new Date().toISOString()
      }), 500));
    }
    const res = await api.post<ApiResponse<any>>(`/checkout/${checkoutId}/address`, address);
    return res.data;
  },

  // Step 3: POST /checkout/:id/voucher — Apply voucher
  applyVoucher: async (checkoutId: string, voucherCode: string): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Voucher applied", data: { discount: 50000 }, timestamp: new Date().toISOString()
      }), 500));
    }
    const res = await api.post<ApiResponse<any>>(`/checkout/${checkoutId}/voucher`, { voucherCode });
    return res.data;
  },

  // Step 4: POST /checkout/:id/confirm — Confirm & create order
  confirmCheckout: async (checkoutId: string, paymentMethod: string): Promise<ApiResponse<Order>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 201, message: "Order confirmed", data: MOCK_ORDERS[0], timestamp: new Date().toISOString()
      }), 1000));
    }
    const res = await api.post<ApiResponse<Order>>(`/checkout/${checkoutId}/confirm`, { paymentMethod });
    return res.data;
  }
};

/**
 * Orders API — User order management
 */
export const OrdersAPI = {
  // GET /user/orders (H1 fix: was /orders/me)
  getMyOrders: async (params?: Record<string, any>): Promise<PaginatedResponse<Order>> => {
    if (USE_MOCK) {
       return new Promise((resolve) => setTimeout(() => resolve({
         data: MOCK_ORDERS,
         meta: { total: 2, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false }
       }), 500));
    }
    const res = await api.get<PaginatedResponse<Order>>("/user/orders", { params });
    return res.data;
  },

  // GET /user/orders/:id (H1 fix: was /orders/:id)
  getOrderById: async (id: string): Promise<ApiResponse<Order>> => {
    if (USE_MOCK) {
       const order = MOCK_ORDERS.find(o => o.id === id) || MOCK_ORDERS[0];
       return new Promise((resolve) => setTimeout(() => resolve({
         statusCode: 200, message: "Success", data: order, timestamp: new Date().toISOString()
       }), 300));
    }
    const res = await api.get<ApiResponse<Order>>(`/user/orders/${id}`);
    return res.data;
  },

  // POST /user/orders/:id/cancel (H1 fix: was PATCH, backend uses POST)
  cancelOrder: async (id: string, reason: string): Promise<ApiResponse<Order>> => {
    if (USE_MOCK) {
       return new Promise((resolve) => setTimeout(() => {
         const order = { ...MOCK_ORDERS[0], status: "CANCELLED" as any };
         resolve({
           statusCode: 200, message: "Order cancelled", data: order, timestamp: new Date().toISOString()
         });
       }, 500));
    }
    const res = await api.post<ApiResponse<Order>>(`/user/orders/${id}/cancel`, { reason });
    return res.data;
  }
};

/**
 * Admin Orders API
 */
export const AdminOrdersAPI = {
  // GET /admin/orders — Admin list all orders
  getOrders: async (params?: Record<string, any>): Promise<PaginatedResponse<Order>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        data: MOCK_ORDERS,
        meta: { total: 2, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false }
      }), 500));
    }
    const res = await api.get<PaginatedResponse<Order>>("/admin/orders", { params });
    return res.data;
  },

  // PATCH /admin/orders/:id/status — Admin update order status
  updateStatus: async (id: string, status: string): Promise<ApiResponse<Order>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Status updated", data: { ...MOCK_ORDERS[0], status } as any, timestamp: new Date().toISOString()
      }), 500));
    }
    const res = await api.patch<ApiResponse<Order>>(`/admin/orders/${id}/status`, { status });
    return res.data;
  },

  // GET /admin/orders/:id — Admin get order detail
  getOrderById: async (id: string): Promise<ApiResponse<Order>> => {
    if (USE_MOCK) {
      const order = MOCK_ORDERS.find(o => o.id === id) || MOCK_ORDERS[0];
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Success", data: order, timestamp: new Date().toISOString()
      }), 400));
    }
    const res = await api.get<ApiResponse<Order>>(`/admin/orders/${id}`);
    return res.data;
  }
};
