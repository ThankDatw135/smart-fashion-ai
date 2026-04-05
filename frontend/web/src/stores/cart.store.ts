import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // Tách biệt item id với product id (1 sp có thể có nhiều size)
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  attributes: {
    color?: string;
    size?: string;
  };
  selected?: boolean; // Tích chọn để thanh toán
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleSelection: (id: string) => void;
  toggleAllSelections: (selected: boolean) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === newItem.productId && 
            i.attributes.color === newItem.attributes.color &&
            i.attributes.size === newItem.attributes.size
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === existing.id
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...newItem, id: Math.random().toString(36).substring(7), selected: true }] };
        });
      },
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((i) => i.id === id ? { ...i, quantity } : i)
      })),
      toggleSelection: (id) => set((state) => ({
        items: state.items.map((i) => i.id === id ? { ...i, selected: !i.selected } : i)
      })),
      toggleAllSelections: (selected) => set((state) => ({
        items: state.items.map((i) => ({ ...i, selected }))
      })),
      clearCart: () => set({ items: [] })
    }),
    {
      name: "cart-storage",
    }
  )
);

export const useCartTotals = () => {
  const items = useCartStore((s) => s.items);
  const selectedItems = items.filter(i => i.selected !== false);
  const subtotal = selectedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const selectedCount = selectedItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const itemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalSubtotal = items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  return { items, selectedItems, subtotal, selectedCount, itemCount, totalSubtotal };
};
