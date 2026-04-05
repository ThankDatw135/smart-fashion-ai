import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";

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

        // Sync to server if logged in
        if (token) {
          if (isCurrentlyIn) {
            api.delete(`/wishlist/${productId}`).catch(console.error);
          } else {
            api.post(`/wishlist/${productId}`).catch(console.error);
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
          const serverItems: string[] = res.data?.data?.map((w: any) => w.productId) || [];
          const localItems = get().items;

          // Merge: union of local and server
          const merged = [...new Set([...localItems, ...serverItems])];
          set({ items: merged });

          // Sync any local-only items to server
          const localOnly = localItems.filter((id) => !serverItems.includes(id));
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
