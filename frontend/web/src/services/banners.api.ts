import { api, USE_MOCK } from "./api";
import { Banner } from "@/types/banner";
import { ApiResponse } from "@/types/api";

const MOCK_BANNERS: Banner[] = [
  {
    id: "1",
    title: "Sale Mùa Hè",
    imageUrl: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200",
    link: "/category/summer",
    position: "HERO",
    startDate: "2026-06-01T00:00:00Z",
    endDate: "2026-08-31T23:59:59Z",
    isActive: true
  }
];

export const BannersAPI = {
  getBanners: async (): Promise<ApiResponse<Banner[]>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Success", data: MOCK_BANNERS, timestamp: new Date().toISOString()
      }), 400));
    }
    const res = await api.get<ApiResponse<Banner[]>>("/banners");
    return res.data;
  },

  createBanner: async (data: Partial<Banner>): Promise<ApiResponse<Banner>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 201, message: "Created", data: { id: Date.now().toString(), ...data } as Banner, timestamp: new Date().toISOString()
      }), 600));
    }
    // H1 fix: admin endpoint uses /admin/banners
    const res = await api.post<ApiResponse<Banner>>("/admin/banners", data);
    return res.data;
  },

  updateBanner: async (id: string, data: Partial<Banner>): Promise<ApiResponse<Banner>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Updated", data: { id, ...data } as Banner, timestamp: new Date().toISOString()
      }), 600));
    }
    // H1 fix: admin endpoint uses /admin/banners, PATCH to match backend
    const res = await api.patch<ApiResponse<Banner>>(`/admin/banners/${id}`, data);
    return res.data;
  }
};
