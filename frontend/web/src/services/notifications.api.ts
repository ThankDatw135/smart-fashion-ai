import { api, USE_MOCK } from "./api";
import { PaginatedResponse, ApiResponse } from "@/types/api";

export const NotificationsAPI = {
  getMyNotifications: async (params?: Record<string, any>): Promise<PaginatedResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        data: [
          { id: "noti_1", title: "Đơn hàng đã được giao", message: "Đơn hàng SF-8A9B2C đã giao thành công.", isRead: false, createdAt: new Date().toISOString() },
          { id: "noti_2", title: "Voucher mới dành cho bạn", message: "Tặng bạn voucher 50K cho đơn hàng tiếp theo.", isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() }
        ],
        meta: { total: 2, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false }
      }), 400));
    }
    const res = await api.get<PaginatedResponse<any>>("/notifications", { params });
    return res.data;
  },

  markAsRead: async (notificationId: string): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Marked as read", data: {}, timestamp: new Date().toISOString()
      }), 300));
    }
    const res = await api.patch(`/notifications/${notificationId}/read`);
    return res.data;
  }
};
