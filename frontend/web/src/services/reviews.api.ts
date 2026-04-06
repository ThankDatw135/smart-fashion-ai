import { api, USE_MOCK } from "./api";
import { Review } from "@/types/review";
import { PaginatedResponse, ApiResponse } from "@/types/api";
import { MOCK_REVIEWS } from "@/mocks/reviews.mock";

export const ReviewsAPI = {
  // GET /reviews/product/:productId (H1 fix: was /products/:id/reviews, backend uses /reviews/product/:productId)
  getProductReviews: async (productId: string, params?: Record<string, any>): Promise<PaginatedResponse<Review>> => {
    if (USE_MOCK) {
      const filtered = MOCK_REVIEWS.filter(r => r.productId === productId);
      return new Promise((resolve) => setTimeout(() => resolve({
        data: filtered,
        meta: { total: filtered.length, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false }
      }), 400));
    }
    const res = await api.get<PaginatedResponse<Review>>(`/reviews/product/${productId}`, { params });
    return res.data;
  },

  // GET /admin/reviews
  getAdminReviews: async (params?: Record<string, any>): Promise<PaginatedResponse<Review>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        data: MOCK_REVIEWS,
        meta: { total: MOCK_REVIEWS.length, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false }
      }), 400));
    }
    const res = await api.get<PaginatedResponse<Review>>('/admin/reviews', { params });
    return res.data;
  },

  // POST /reviews (H1 fix: was POST /products/:productId/reviews, backend uses POST /reviews with body containing productId)
  createReview: async (payload: FormData): Promise<ApiResponse<Review>> => {
    if (USE_MOCK) {
      const newReview = { ...MOCK_REVIEWS[0], id: "rev_new" + Date.now() } as any;
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 201, message: "Review created", data: newReview, timestamp: new Date().toISOString()
      }), 500));
    }
    const res = await api.post<ApiResponse<Review>>("/reviews", payload, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
  },

  // DELETE /reviews/:id (delete own review)
  deleteReview: async (id: string): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Deleted", data: {}, timestamp: new Date().toISOString()
      }), 400));
    }
    const res = await api.delete<ApiResponse<any>>(`/reviews/${id}`);
    return res.data;
  }
};
