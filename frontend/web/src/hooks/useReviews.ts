import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReviewsAPI } from "@/services/reviews.api";

// Lấy danh sách đánh giá của 1 sản phẩm
export function useProductReviews(productId: string, params?: Record<string, any>) {
  return useQuery({
    queryKey: ["reviews", productId, params],
    queryFn: () => ReviewsAPI.getProductReviews(productId, params),
    enabled: !!productId,
  });
}

// Lấy danh sách đánh giá cho Admin
export function useAdminReviews(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["admin", "reviews", params],
    queryFn: () => ReviewsAPI.getAdminReviews(params),
  });
}

// Tạo đánh giá mới (productId is included in FormData)
export function useCreateReview(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      ReviewsAPI.createReview(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    },
  });
}
