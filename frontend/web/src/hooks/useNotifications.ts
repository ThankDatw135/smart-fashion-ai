import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationsAPI } from "@/services/notifications.api";

// Lấy danh sách thông báo
export function useNotifications(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => NotificationsAPI.getMyNotifications(params),
  });
}

// Đếm thông báo chưa đọc (polling mỗi 30s cho badge)
export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await NotificationsAPI.getMyNotifications({ limit: 50 });
      return res?.data?.filter((n: any) => !n.isRead).length || 0;
    },
    refetchInterval: 30000,
  });
}

// Đánh dấu đã đọc
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      NotificationsAPI.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
