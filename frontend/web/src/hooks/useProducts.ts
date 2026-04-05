import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductsAPI } from "@/services/products.api";
import { Product } from "@/types/product";

// Lấy danh sách sản phẩm (có phân trang + filter)
export function useProducts(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => ProductsAPI.getProducts(params),
  });
}

// Lấy chi tiết sản phẩm theo slug
export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => ProductsAPI.getProductBySlug(slug),
    enabled: !!slug,
  });
}

// Tạo sản phẩm mới (FormData for multipart/form-data upload)
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => ProductsAPI.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// Cập nhật sản phẩm 
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => ProductsAPI.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}
