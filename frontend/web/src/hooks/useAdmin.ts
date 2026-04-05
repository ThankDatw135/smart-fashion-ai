import { useQuery } from "@tanstack/react-query";
import { AdminAPI } from "@/services/admin.api";

// Lấy dashboard statistics
export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => AdminAPI.getDashboardStats(),
    staleTime: 2 * 60 * 1000, // Refresh mỗi 2 phút
  });
}
