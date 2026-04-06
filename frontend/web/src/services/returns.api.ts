import { api, USE_MOCK } from "./api";
import { PaginatedResponse, ApiResponse } from "@/types/api";

export interface ReturnRequest {
  id: string;
  orderId: string;
  customerName: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "completed";
  createdAt: string; // ISO string back to Date on client
}

export const AdminReturnsAPI = {
  getReturns: async (params?: Record<string, any>): Promise<PaginatedResponse<ReturnRequest>> => {
    if (USE_MOCK) {
       return new Promise((resolve) => setTimeout(() => resolve({
         data: [
            {
              id: "RET-1001",
              orderId: "ORD-2026-0985",
              customerName: "Nguyễn Văn A",
              reason: "Sản phẩm không đúng kích cỡ mô tả.",
              status: "pending",
              createdAt: new Date().toISOString(),
            },
            {
              id: "RET-1002",
              orderId: "ORD-2026-0980",
              customerName: "Trần Thị B",
              reason: "Lỗi đường chỉ may bên hông áo.",
              status: "approved",
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              id: "RET-1003",
              orderId: "ORD-2026-0950",
              customerName: "Lê C",
              reason: "Không thích nữa.",
              status: "rejected",
              createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            },
         ],
         meta: { total: 3, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false }
       }), 400));
    }
    const res = await api.get<PaginatedResponse<ReturnRequest>>("/admin/returns", { params });
    return res.data;
  },

  updateStatus: async (id: string, status: string): Promise<ApiResponse<ReturnRequest>> => {
    const res = await api.patch<ApiResponse<ReturnRequest>>(`/admin/returns/${id}/status`, { status });
    return res.data;
  }
};
