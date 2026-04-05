import { api, USE_MOCK } from "./api";
import { ApiResponse } from "@/types/api";
import { MOCK_ADMIN_REVENUE, MOCK_ADMIN_USERS, MOCK_ADMIN_SUMMARY } from "@/mocks/stats.mock";

export const AdminAPI = {
  // GET /admin/dashboard — KPI cards
  getDashboardStats: async (): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, 
        message: "Success", 
        data: {
          summary: MOCK_ADMIN_SUMMARY,
          revenue: MOCK_ADMIN_REVENUE,
          usersByAge: MOCK_ADMIN_USERS
        }, 
        timestamp: new Date().toISOString()
      }), 600));
    }
    const res = await api.get("/admin/dashboard");
    return res.data;
  },

  // GET /admin/dashboard/revenue?days=30
  getRevenueChart: async (days: number = 30): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Success", data: MOCK_ADMIN_REVENUE, timestamp: new Date().toISOString()
      }), 400));
    }
    const res = await api.get("/admin/dashboard/revenue", { params: { days } });
    return res.data;
  },

  // GET /admin/dashboard/top-products?limit=10
  getTopProducts: async (limit: number = 10): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Success", data: [], timestamp: new Date().toISOString()
      }), 400));
    }
    const res = await api.get("/admin/dashboard/top-products", { params: { limit } });
    return res.data;
  },

  // GET /admin/dashboard/order-status
  getOrderStatusSummary: async (): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Success", data: { pending: 5, processing: 12, shipped: 8, delivered: 45, cancelled: 3 }, timestamp: new Date().toISOString()
      }), 300));
    }
    const res = await api.get("/admin/dashboard/order-status");
    return res.data;
  }
};
