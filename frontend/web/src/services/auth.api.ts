import { api, USE_MOCK } from "./api";
import { ApiResponse } from "@/types/api";

export const AuthAPI = {
  login: async (credentials: Record<string, any>): Promise<ApiResponse<{ accessToken: string; user: any }>> => {
    if (USE_MOCK) {
       // Mock response — matches backend schema (accessToken, not token)
       return new Promise((resolve) => setTimeout(() => resolve({
         statusCode: 200,
         message: "Login successful",
         data: {
           accessToken: "mock-jwt-token-abc-123",
           user: {
             id: credentials.email?.includes("admin") ? "admin_001" : "usr_001",
             email: credentials.email || "customer@gmail.com",
             role: credentials.email?.includes("admin") ? "admin" : "user",
             fullName: credentials.email?.includes("admin") ? "Administrator" : "Mock User",
           }
         },
         timestamp: new Date().toISOString()
       }), 1000));
    }
    const res = await api.post("/auth/login", credentials);
    return res.data;
  },

  register: async (userData: Record<string, any>): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 201, message: "Register successful", data: {}, timestamp: new Date().toISOString()
      }), 1000));
    }
    const res = await api.post("/auth/register", userData);
    return res.data;
  },

  verifyEmail: async (dto: { email: string; otp: string }): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Email verified", data: {}, timestamp: new Date().toISOString()
      }), 800));
    }
    const res = await api.post("/auth/verify-email", dto);
    return res.data;
  },

  forgotPassword: async (dto: { email: string }): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "OTP sent", data: {}, timestamp: new Date().toISOString()
      }), 800));
    }
    const res = await api.post("/auth/forgot-password", dto);
    return res.data;
  },

  verifyOtp: async (dto: { email: string; otp: string }): Promise<ApiResponse<{ resetToken: string }>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "OTP valid", data: { resetToken: "mock-reset-token" }, timestamp: new Date().toISOString()
      }), 800));
    }
    const res = await api.post("/auth/verify-otp", dto);
    return res.data;
  },

  resetPassword: async (dto: { resetToken: string; newPassword: string }): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Password reset", data: {}, timestamp: new Date().toISOString()
      }), 800));
    }
    const res = await api.post("/auth/reset-password", dto);
    return res.data;
  },

  refreshToken: async (): Promise<ApiResponse<{ accessToken: string }>> => {
    // Refresh token is sent via HTTP-Only cookie automatically
    const res = await api.post("/auth/refresh");
    return res.data;
  },

  logout: async (): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Logout successful", data: {}, timestamp: new Date().toISOString()
      }), 500));
    }
    const res = await api.post("/auth/logout");
    return res.data;
  },

  getMe: async (): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Success", data: { user: { id: "usr_001", email: "mock@test.com", role: "user" } }, timestamp: new Date().toISOString()
      }), 300));
    }
    // Fetch full profile from /users/me instead of /auth/me (which only returns JWT payload)
    const res = await api.get("/users/me");
    return {
      ...res.data,
      data: {
        user: res.data.data
      }
    };
  }
};
