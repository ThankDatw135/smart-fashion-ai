import { useQuery } from "@tanstack/react-query";
import { InventoryAPI } from "@/services/inventory.api";

export function useInventory(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["inventory", params],
    queryFn: () => InventoryAPI.getInventoryInsights(params),
  });
}
