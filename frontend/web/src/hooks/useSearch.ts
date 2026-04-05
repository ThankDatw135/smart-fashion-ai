import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { SearchAPI } from "@/services/search.api";
import { useFilterStore } from "@/stores/filter.store";

// Hook tìm kiếm sản phẩm (Hybrid: text + vector)
export function useSearch(query: string) {
  const filters = useFilterStore();

  return useQuery({
    queryKey: ["search", query, filters.category, filters.minPrice, filters.maxPrice, filters.sizes, filters.colors, filters.sort],
    queryFn: () =>
      SearchAPI.search(query, {
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sizes: filters.sizes.join(","),
        colors: filters.colors.join(","),
        sort: filters.sort,
      }),
    enabled: query.length >= 2, // Chỉ search khi >= 2 ký tự
  });
}

// Hook gợi ý AI Recommendation
export function useRecommendations(limit = 5) {
  return useQuery({
    queryKey: ["recommendations", limit],
    queryFn: () => SearchAPI.getRecommendations(limit),
    staleTime: 3 * 60 * 1000, // Cache 3 phút
  });
}

// Hook debounce cho search input
export function useDebouncedSearch(delay = 400) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      const timer = setTimeout(() => setDebouncedQuery(value), delay);
      return () => clearTimeout(timer);
    },
    [delay]
  );

  return { query, debouncedQuery, handleChange };
}
