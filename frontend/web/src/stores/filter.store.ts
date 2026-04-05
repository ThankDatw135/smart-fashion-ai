import { create } from "zustand";

interface FilterState {
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  sizes: string[];
  colors: string[];
  sort: string;
  setCategory: (category: string | null) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  toggleSize: (size: string) => void;
  toggleColor: (color: string) => void;
  setSort: (sort: string) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  category: null,
  minPrice: null,
  maxPrice: null,
  sizes: [],
  colors: [],
  sort: "newest",
  setCategory: (category) => set({ category }),
  setPriceRange: (min, max) => set({ minPrice: min, maxPrice: max }),
  toggleSize: (size) =>
    set((state) => ({
      sizes: state.sizes.includes(size)
        ? state.sizes.filter((s) => s !== size)
        : [...state.sizes, size],
    })),
  toggleColor: (color) =>
    set((state) => ({
      colors: state.colors.includes(color)
        ? state.colors.filter((c) => c !== color)
        : [...state.colors, color],
    })),
  setSort: (sort) => set({ sort }),
  clearFilters: () =>
    set({
      category: null,
      minPrice: null,
      maxPrice: null,
      sizes: [],
      colors: [],
      sort: "newest",
    }),
}));
