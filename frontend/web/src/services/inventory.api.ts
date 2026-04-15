import { api, USE_MOCK } from "./api";
import { PaginatedResponse } from "@/types/api";
import { Product } from "@/types/product";

export interface InventoryItemResponse {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  threshold: number;
  price: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

export const InventoryAPI = {
  getInventoryInsights: async (params?: Record<string, any>): Promise<PaginatedResponse<InventoryItemResponse>> => {
    if (USE_MOCK) {
       return new Promise((resolve) => setTimeout(() => resolve({
         data: [
            {
              id: "PROD-001",
              name: "Áo Thun Cổ Tròn Basic",
              sku: "TSHIRT-001",
              category: "Thời trang nam",
              stock: 250,
              threshold: 50,
              price: 150000,
              status: "in_stock",
            },
            {
              id: "PROD-002",
              name: "Quần Jeans Slimfit",
              sku: "JEANS-002",
              category: "Thời trang nam",
              stock: 12,
              threshold: 20,
              price: 450000,
              status: "low_stock",
            },
            {
              id: "PROD-003",
              name: "Váy Hoa Mùa Hè",
              sku: "DRESS-003",
              category: "Thời trang nữ",
              stock: 0,
              threshold: 15,
              price: 350000,
              status: "out_of_stock",
            },
            {
              id: "PROD-004",
              name: "Túi Xách Da Mini",
              sku: "BAG-004",
              category: "Phụ kiện",
              stock: 85,
              threshold: 10,
              price: 850000,
              status: "in_stock",
            },
         ],
         meta: { total: 4, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false }
       }), 400));
    }
    const res = await api.get<PaginatedResponse<InventoryItemResponse>>("/admin/inventory", { params });
    return res.data;
  },

  // ADMIN: PATCH /admin/inventory/:id — Cập nhật tồn kho
  updateStock: async (id: string, stock: number): Promise<{ data: InventoryItemResponse }> => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({
        data: { id, name: "", sku: "", category: "", stock, threshold: 0, price: 0, status: stock > 0 ? "in_stock" : "out_of_stock" }
      }), 400));
    }
    const res = await api.patch<{ data: InventoryItemResponse }>(`/admin/inventory/${id}`, { stock });
    return res.data;
  }
};

