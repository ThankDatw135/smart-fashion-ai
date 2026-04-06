import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UsersAPI } from "@/services/users.api";

export function useUsers(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => UsersAPI.getUsers(params),
  });
}

export function useUserById(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => UsersAPI.getUserById(id),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) => UsersAPI.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
