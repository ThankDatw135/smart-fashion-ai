import { api, USE_MOCK } from "./api";
import { Product } from "@/types/product";
import { PaginatedResponse } from "@/types/api";
import { MOCK_PRODUCTS } from "@/mocks/products.mock";

export const SearchAPI = {
  // Hybrid Search (Text + Vector)
  search: async (query: string, params?: Record<string, any>): Promise<PaginatedResponse<Product>> => {
    if (USE_MOCK) {
       // Simple mock text filter
       const filtered = MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
       return new Promise((resolve) => setTimeout(() => resolve({
         data: filtered,
         meta: { total: filtered.length, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false }
       }), 500));
    }
    const res = await api.get<PaginatedResponse<Product>>("/search", { params: { q: query, ...params } });
    return res.data;
  },

  // AI Recommendation engine
  getRecommendations: async (limit: number = 5): Promise<Product[]> => {
    if (USE_MOCK) {
       return new Promise((resolve) => setTimeout(() => resolve(MOCK_PRODUCTS.slice(0, limit)), 500));
    }
    const res = await api.get<{ data: Product[] }>("/recommendations", { params: { limit } });
    return res.data.data;
  }
};
