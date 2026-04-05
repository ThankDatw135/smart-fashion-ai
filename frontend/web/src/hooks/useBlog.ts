import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BlogAPI } from "@/services/blog.api";

// Lấy danh sách bài viết blog (phân trang)
export function useBlogPosts(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["blog", params],
    queryFn: () => BlogAPI.getPosts(params),
  });
}

// Lấy chi tiết bài viết theo slug
export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ["blog", slug],
    queryFn: () => BlogAPI.getPostBySlug(slug),
    enabled: !!slug,
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => BlogAPI.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog"] });
    },
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) => BlogAPI.updatePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog"] });
    },
  });
}
