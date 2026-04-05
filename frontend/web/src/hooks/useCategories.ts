import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductsAPI } from "@/services/products.api";
import { Category } from "@/types/product";

// Lấy danh sách danh mục (cây 2 cấp)
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => ProductsAPI.getCategories(),
    staleTime: 5 * 60 * 1000, // Cache 5 phút vì danh mục ít thay đổi
  });
}

// Tạo danh mục mới
export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Category>) => ProductsAPI.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

// Cập nhật danh mục
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => ProductsAPI.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
