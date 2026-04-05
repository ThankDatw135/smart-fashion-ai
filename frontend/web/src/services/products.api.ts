import { api, USE_MOCK } from "./api";
import { Product, Category } from "@/types/product";
import { PaginatedResponse, ApiResponse } from "@/types/api";
import { MOCK_PRODUCTS } from "@/mocks/products.mock";
import { MOCK_CATEGORIES } from "@/mocks/categories.mock";

export const ProductsAPI = {
  // PUBLIC: GET /products (matches BE: GET /products)
  getProducts: async (params?: Record<string, any>): Promise<PaginatedResponse<Product>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        data: MOCK_PRODUCTS,
        meta: { total: 2, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false }
      }), 500));
    }
    const res = await api.get<PaginatedResponse<Product>>("/products", { params });
    return res.data;
  },

  // PUBLIC: GET /products/:slug (matches BE: GET /products/:slug)
  getProductBySlug: async (slug: string): Promise<ApiResponse<Product>> => {
    if (USE_MOCK) {
      const product = MOCK_PRODUCTS.find(p => p.slug === slug);
      if (!product) throw new Error("Product not found");
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Success", data: product, timestamp: new Date().toISOString()
      }), 300));
    }
    // H1 fix: was /products/slug/${slug}, backend is /products/:slug
    const res = await api.get<ApiResponse<Product>>(`/products/${slug}`);
    return res.data;
  },

  // PUBLIC: GET /products/:slug/related
  getRelatedProducts: async (slug: string): Promise<ApiResponse<Product[]>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Success", data: MOCK_PRODUCTS.slice(0, 4), timestamp: new Date().toISOString()
      }), 400));
    }
    const res = await api.get<ApiResponse<Product[]>>(`/products/${slug}/related`);
    return res.data;
  },

  // PUBLIC: GET /categories (matches BE: GET /categories)
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Success", data: MOCK_CATEGORIES, timestamp: new Date().toISOString()
      }), 300));
    }
    const res = await api.get<ApiResponse<Category[]>>("/categories");
    return res.data;
  },

  // ADMIN: POST /admin/categories (H1 fix: was /categories)
  createCategory: async (data: Partial<Category>): Promise<ApiResponse<Category>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 201, message: "Created", data: { ...data, id: "cat_" + Date.now() } as Category, timestamp: new Date().toISOString()
      }), 500));
    }
    const res = await api.post<ApiResponse<Category>>("/admin/categories", data);
    return res.data;
  },

  // ADMIN: POST /admin/products (H1 fix: was /products)
  createProduct: async (data: FormData): Promise<ApiResponse<Product>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 201, message: "Created", data: { id: "prod_" + Date.now() } as Product, timestamp: new Date().toISOString()
      }), 500));
    }
    const res = await api.post<ApiResponse<Product>>("/admin/products", data, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
  },

  // ADMIN: PUT /admin/products/:id (H1 fix: was PATCH /products/${id})
  updateProduct: async (id: string, data: Partial<Product>): Promise<ApiResponse<Product>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Updated", data: { ...data, id } as Product, timestamp: new Date().toISOString()
      }), 500));
    }
    const res = await api.put<ApiResponse<Product>>(`/admin/products/${id}`, data);
    return res.data;
  },

  // ADMIN: DELETE /admin/products/:id (soft delete)
  deleteProduct: async (id: string): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Deleted", data: {}, timestamp: new Date().toISOString()
      }), 400));
    }
    const res = await api.delete<ApiResponse<any>>(`/admin/products/${id}`);
    return res.data;
  },

  // ADMIN: PUT /admin/categories/:id (H1 fix: was PUT /categories/${id})
  updateCategory: async (id: string, data: Partial<Category>): Promise<ApiResponse<Category>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
         statusCode: 200, message: "Category updated", data: { id, ...data } as Category, timestamp: new Date().toISOString()
      }), 400));
    }
    const res = await api.put<ApiResponse<Category>>(`/admin/categories/${id}`, data);
    return res.data;
  },

  // ADMIN: DELETE /admin/categories/:id
  deleteCategory: async (id: string): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Deleted", data: {}, timestamp: new Date().toISOString()
      }), 400));
    }
    const res = await api.delete<ApiResponse<any>>(`/admin/categories/${id}`);
    return res.data;
  },

  // ADMIN: POST /admin/products/:id/variants
  addVariant: async (productId: string, data: { size: string; color: string; colorCode?: string; stockQuantity: number }): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 201, message: "Variant added", data: { id: "var_" + Date.now(), ...data }, timestamp: new Date().toISOString()
      }), 500));
    }
    const res = await api.post<ApiResponse<any>>(`/admin/products/${productId}/variants`, data);
    return res.data;
  },

  // ADMIN: PUT /admin/variants/:variantId
  updateVariant: async (variantId: string, data: Partial<{ size: string; color: string; colorCode: string; stockQuantity: number; isActive: boolean }>): Promise<ApiResponse<any>> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        statusCode: 200, message: "Variant updated", data: { id: variantId, ...data }, timestamp: new Date().toISOString()
      }), 400));
    }
    const res = await api.put<ApiResponse<any>>(`/admin/variants/${variantId}`, data);
    return res.data;
  }
};
