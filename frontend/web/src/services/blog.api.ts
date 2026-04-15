import { api, USE_MOCK } from "./api";
import { BlogPost } from "@/types/blog";
import { PaginatedResponse, ApiResponse } from "@/types/api";
import { MOCK_BLOGS } from "@/mocks/blogs.mock";

export const BlogAPI = {
  getPosts: async (params?: Record<string, any>): Promise<PaginatedResponse<BlogPost>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        data: MOCK_BLOGS,
        meta: { total: 2, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false }
      }), 400));
    }
    const res = await api.get<PaginatedResponse<BlogPost>>("/blog", { params });
    return res.data;
  },

  getPostBySlug: async (slug: string): Promise<ApiResponse<BlogPost>> => {
    if (USE_MOCK) {
      const post = MOCK_BLOGS.find(b => b.slug === slug);
      if (!post) throw new Error("Blog post not found");
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Success", data: post, timestamp: new Date().toISOString()
      }), 400));
    }
    // H1 fix: was /blog/slug/${slug}, backend uses /blog/:slug
    const res = await api.get<ApiResponse<BlogPost>>(`/blog/${slug}`);
    return res.data;
  },

  createPost: async (data: Partial<BlogPost>): Promise<ApiResponse<BlogPost>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 201, message: "Blog post created", data: { id: Date.now().toString(), ...data } as BlogPost, timestamp: new Date().toISOString()
      }), 600));
    }
    // H1 fix: admin endpoint uses /admin/blog
    const res = await api.post<ApiResponse<BlogPost>>("/admin/blog", data);
    return res.data;
  },

  updatePost: async (id: string, data: Partial<BlogPost>): Promise<ApiResponse<BlogPost>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Blog post updated", data: { id, ...data } as BlogPost, timestamp: new Date().toISOString()
      }), 600));
    }
    // H1 fix: admin endpoint uses /admin/blog and PATCH method
    const res = await api.patch<ApiResponse<BlogPost>>(`/admin/blog/${id}`, data);
    return res.data;
  },

  getPostById: async (id: string): Promise<ApiResponse<BlogPost>> => {
    if (USE_MOCK) {
      const post = MOCK_BLOGS.find(b => b.id === id);
      if (!post) throw new Error("Blog post not found");
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Success", data: post, timestamp: new Date().toISOString()
      }), 400));
    }
    const res = await api.get<ApiResponse<BlogPost>>(`/admin/blog/${id}`);
    return res.data;
  },

  deletePost: async (id: string): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Blog post deleted", data: null, timestamp: new Date().toISOString()
      }), 600));
    }
    const res = await api.delete<ApiResponse<any>>(`/admin/blog/${id}`);
    return res.data;
  }
};
