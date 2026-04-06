import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";

/** Kiểm tra chuỗi có phải UUID hợp lệ không (để không gọi API với mock ID dạng 'fp1') */
const isValidUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

/**
 * M4 fix: Hybrid Wishlist — localStorage for guests, server sync for logged-in users
 */
interface WishlistState {
  items: string[]; // productId[]
  toggle: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clear: () => void;
  syncFromServer: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (productId) => {
        const isCurrentlyIn = get().items.includes(productId);
        const token = useAuthStore.getState().token;

        // Update local state immediately (optimistic)
        set((state) => ({
          items: isCurrentlyIn
            ? state.items.filter((id) => id !== productId)
            : [...state.items, productId],
        }));

        // Chỉ sync server khi đã đăng nhập VÀ productId là UUID hợp lệ
        if (token && isValidUUID(productId)) {
          if (isCurrentlyIn) {
            api.delete(`/wishlist/${productId}`).catch((err) => {
              console.error(err);
              // Rollback optimistic update
              set((state) => ({ items: [...state.items, productId] }));
            });
          } else {
            api.post(`/wishlist/${productId}`).catch((err) => {
              console.error(err);
              // Rollback optimistic update
              set((state) => ({ items: state.items.filter((id) => id !== productId) }));
            });
          }
        }
      },

      isInWishlist: (productId) => get().items.includes(productId),

      clear: () => set({ items: [] }),

      // Fetch wishlist from server and merge with local
      syncFromServer: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        try {
          const res = await api.get("/wishlist");
          // Backend trả về { items: [...], pagination: {...} }
          const raw = res.data;
          let serverData: any[] = [];
          if (Array.isArray(raw)) serverData = raw;
          else if (Array.isArray(raw?.items)) serverData = raw.items;
          else if (Array.isArray(raw?.data)) serverData = raw.data;

          const serverItems: string[] = serverData
            .map((w: any) => w.product?.id || w.productId || w.id)
            .filter(Boolean);
          const localItems = get().items;

          // Merge: union of local (UUID only) and server
          const merged = [...new Set([...localItems, ...serverItems])];
          set({ items: merged });

          // Sync local-only VALID UUID items to server
          const localOnly = localItems.filter(
            (id) => isValidUUID(id) && !serverItems.includes(id)
          );
          for (const id of localOnly) {
            api.post(`/wishlist/${id}`).catch(console.error);
          }
        } catch {
          // Silently fail — keep local data
        }
      },
    }),
    { name: "wishlist-storage" }
  )
);

// Re-export as hook
export function useWishlist() {
  return useWishlistStore();
}
