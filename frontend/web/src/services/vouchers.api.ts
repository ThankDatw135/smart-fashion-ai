import { api, USE_MOCK } from "./api";
import { Voucher, UserVoucher } from "@/types/voucher";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { MOCK_VOUCHERS, MOCK_USER_VOUCHERS } from "@/mocks/vouchers.mock";

export const VouchersAPI = {
  getPublicVouchers: async (params?: Record<string, any>): Promise<PaginatedResponse<Voucher>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        data: MOCK_VOUCHERS,
        meta: { total: 2, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false }
      }), 400));
    }
    const res = await api.get<PaginatedResponse<Voucher>>("/vouchers", { params });
    return res.data;
  },

  getMyVouchers: async (): Promise<ApiResponse<UserVoucher[]>> => {
    if (USE_MOCK) {
       return new Promise((resolve) => setTimeout(() => resolve({
         statusCode: 200, message: "Success", data: MOCK_USER_VOUCHERS, timestamp: new Date().toISOString()
       }), 400));
    }
    const res = await api.get<ApiResponse<UserVoucher[]>>("/vouchers/me");
    return res.data;
  },

  collectVoucher: async (voucherId: string): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
       return new Promise((resolve) => setTimeout(() => resolve({
         statusCode: 200, message: "Collected", data: {}, timestamp: new Date().toISOString()
       }), 500));
    }
    const res = await api.post(`/vouchers/${voucherId}/collect`);
    return res.data;
  },

  createVoucher: async (data: Partial<Voucher>): Promise<ApiResponse<Voucher>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 201, message: "Voucher created", data: { id: Date.now().toString(), ...data } as Voucher, timestamp: new Date().toISOString()
      }), 600));
    }
    // H1 fix: admin endpoint uses /admin/vouchers
    const res = await api.post<ApiResponse<Voucher>>("/admin/vouchers", data);
    return res.data;
  },

  updateVoucher: async (id: string, data: Partial<Voucher>): Promise<ApiResponse<Voucher>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Voucher updated", data: { id, ...data } as Voucher, timestamp: new Date().toISOString()
      }), 600));
    }
    // H1 fix: admin endpoint, PATCH to match backend
    const res = await api.patch<ApiResponse<Voucher>>(`/admin/vouchers/${id}`, data);
    return res.data;
  },

  deleteVoucher: async (id: string): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Deleted", data: {}, timestamp: new Date().toISOString()
      }), 400));
    }
    const res = await api.delete<ApiResponse<any>>(`/admin/vouchers/${id}`);
    return res.data;
  },

  getVoucherById: async (id: string): Promise<ApiResponse<Voucher>> => {
    if (USE_MOCK) {
      const voucher = MOCK_VOUCHERS.find(v => v.id === id) || MOCK_VOUCHERS[0];
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Success", data: voucher, timestamp: new Date().toISOString()
      }), 300));
    }
    const res = await api.get<ApiResponse<Voucher>>(`/admin/vouchers/${id}`);
    return res.data;
  },

  // PUBLIC: GET /vouchers/check/:code — Check if voucher code is valid
  checkVoucher: async (code: string): Promise<ApiResponse<Voucher>> => {
    if (USE_MOCK) {
      const voucher = MOCK_VOUCHERS.find(v => v.code === code);
      if (!voucher) {
        return new Promise((_resolve, reject) => setTimeout(() => reject(new Error("Voucher not found")), 300));
      }
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Valid", data: voucher, timestamp: new Date().toISOString()
      }), 300));
    }
    const res = await api.get<ApiResponse<Voucher>>(`/vouchers/check/${code}`);
    return res.data;
  }
};
