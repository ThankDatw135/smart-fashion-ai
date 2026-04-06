import { api, USE_MOCK } from "./api";
import { User } from "@/types/user";
import { PaginatedResponse, ApiResponse } from "@/types/api";

const MOCK_USERS: User[] = [
  {
    id: "1",
    email: "admin@smartfashion.ai",
    fullName: "Quản Trị Viên",
    role: "admin",
    status: "ACTIVE",
    isVIP: true,
    createdAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "2",
    email: "customer@gmail.com",
    fullName: "Khách Hàng Vip",
    phone: "0987654321",
    role: "user",
    status: "ACTIVE",
    isVIP: true,
    createdAt: "2025-02-14T00:00:00Z"
  }
];

export const UsersAPI = {
  // User profile: GET /users/me
  getMyProfile: async (): Promise<ApiResponse<User>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Success", data: MOCK_USERS[1], timestamp: new Date().toISOString()
      }), 300));
    }
    const res = await api.get<ApiResponse<User>>("/users/me");
    return res.data;
  },

  // User profile update: PUT /users/me
  updateMyProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Profile updated", data: { ...MOCK_USERS[1], ...data }, timestamp: new Date().toISOString()
      }), 500));
    }
    const res = await api.put<ApiResponse<User>>("/users/me", data);
    return res.data;
  },

  // Change password: PATCH /users/me/password
  changePassword: async (dto: { currentPassword: string; newPassword: string }): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Password changed", data: {}, timestamp: new Date().toISOString()
      }), 600));
    }
    const res = await api.patch<ApiResponse<any>>("/users/me/password", dto);
    return res.data;
  },

  // Upload avatar: PATCH /users/me/avatar
  updateAvatar: async (file: File): Promise<ApiResponse<{ avatarUrl: string }>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Avatar updated", data: { avatarUrl: "/uploads/avatars/mock.jpg" }, timestamp: new Date().toISOString()
      }), 800));
    }
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await api.patch<ApiResponse<{ avatarUrl: string }>>("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
  },

  // H6: Admin — list all users: GET /admin/users
  getUsers: async (params?: Record<string, any>): Promise<PaginatedResponse<User>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        data: MOCK_USERS,
        meta: { total: 2, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false }
      }), 400));
    }
    const res = await api.get<PaginatedResponse<User>>("/admin/users", { params });
    return res.data;
  },

  // H6: Admin — get user by ID: GET /admin/users/:id
  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    if (USE_MOCK) {
      const user = MOCK_USERS.find(u => u.id === id) || MOCK_USERS[0];
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Success", data: user, timestamp: new Date().toISOString()
      }), 300));
    }
    const res = await api.get<ApiResponse<User>>(`/admin/users/${id}`);
    return res.data;
  },

  // H6: Admin — update user: PUT /admin/users/:id
  updateUser: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "User updated", data: { id, ...data } as User, timestamp: new Date().toISOString()
      }), 600));
    }
    const res = await api.put<ApiResponse<User>>(`/admin/users/${id}`, data);
    return res.data;
  }
};
