import { api, USE_MOCK } from "./api";
import { ApiResponse } from "@/types/api";

export interface UserAddress {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  addressDetail: string;
  isDefault: boolean;
}

export const UserAPI = {
  getProfile: async (): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
       return new Promise((resolve) => setTimeout(() => resolve({
         statusCode: 200, message: "Success", data: { id: "usr_001", email: "mock@test.com", role: "user", fullName: "Mock User" }, timestamp: new Date().toISOString()
       }), 300));
    }
    const res = await api.get("/users/me");
    return res.data;
  },

  updateProfile: async (data: Record<string, any>): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Cập nhật thành công", data: data, timestamp: new Date().toISOString()
      }), 500));
    }
    const res = await api.put("/users/me", data);
    return res.data;
  },

  getAddresses: async (): Promise<ApiResponse<UserAddress[]>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Success", data: [], timestamp: new Date().toISOString()
      }), 300));
    }
    const res = await api.get("/users/me/addresses");
    return res.data;
  },

  addAddress: async (data: Omit<UserAddress, "id">): Promise<ApiResponse<UserAddress>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 201, message: "Success", data: { ...data, id: "mock_addr_" + Date.now() }, timestamp: new Date().toISOString()
      }), 400));
    }
    const res = await api.post("/users/me/addresses", data);
    return res.data;
  },

  updateAddress: async (id: string, data: Partial<UserAddress>): Promise<ApiResponse<UserAddress>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Success", data: { id, ...data } as UserAddress, timestamp: new Date().toISOString()
      }), 400));
    }
    const res = await api.put(`/users/me/addresses/${id}`, data);
    return res.data;
  },

  deleteAddress: async (id: string): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Deleted", data: null, timestamp: new Date().toISOString()
      }), 400));
    }
    const res = await api.delete(`/users/me/addresses/${id}`);
    return res.data;
  },

  setDefaultAddress: async (id: string): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Set default successfully", data: null, timestamp: new Date().toISOString()
      }), 400));
    }
    const res = await api.patch(`/users/me/addresses/${id}/default`);
    return res.data;
  }
};
