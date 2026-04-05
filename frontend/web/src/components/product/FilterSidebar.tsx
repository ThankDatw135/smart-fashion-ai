"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SIZES = ["S", "M", "L", "XL", "XXL"];
const COLORS = [
  { name: "Đen", value: "#000000" },
  { name: "Trắng", value: "#ffffff", border: true },
  { name: "Đỏ", value: "#dc2626" },
  { name: "Xanh", value: "#2563eb" },
  { name: "Nâu", value: "#78350f" },
];
const MATERIALS = ["Cotton hữu cơ", "Polyester tái chế", "Linen cao cấp", "Denim", "Lụa"];
const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "best-selling", label: "Bán chạy" },
  { value: "price-asc", label: "Giá: Thấp đến Cao" },
  { value: "price-desc", label: "Giá: Cao đến Thấp" },
];

interface FilterState {
  priceRange: [number, number];
  sizes: string[];
  colors: string[];
  materials: string[];
  sortBy: string;
}

interface FilterSidebarProps {
  onFilterChange?: (filters: FilterState) => void;
  totalProducts?: number;
  showingCount?: number;
}

export function FilterSidebar({ onFilterChange, totalProducts = 156, showingCount = 20 }: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 2000000],
    sizes: [],
    colors: [],
    materials: [],
    sortBy: "newest",
  });

  const toggleSize = (size: string) => {
    setFilters((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const toggleColor = (color: string) => {
    setFilters((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }));
  };

  const toggleMaterial = (mat: string) => {
    setFilters((prev) => ({
      ...prev,
      materials: prev.materials.includes(mat)
        ? prev.materials.filter((m) => m !== mat)
        : [...prev.materials, mat],
    }));
  };

  const clearAll = () => {
    setFilters({ priceRange: [0, 2000000], sizes: [], colors: [], materials: [], sortBy: "newest" });
  };

  const activeCount = filters.sizes.length + filters.colors.length + filters.materials.length;

  return (
    <aside className="w-full lg:w-72 xl:w-80 lg:sticky lg:top-28 h-fit shrink-0">
      <div className="bg-card p-6 lg:p-8 rounded-xl shadow-sm space-y-8 border border-border/10">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="font-heading text-xl font-semibold">Bộ lọc</h2>
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="text-xs font-medium uppercase tracking-widest text-primary hover:underline transition-all"
            >
              Xóa bộ lọc ({activeCount})
            </button>
          )}
        </div>

        {/* Price Range */}
        <section>
          <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-muted-foreground">
            Khoảng giá
          </h3>
          <div className="space-y-3">
            <input
              type="range"
              min={0}
              max={2000000}
              step={50000}
              value={filters.priceRange[1]}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  priceRange: [0, Number(e.target.value)],
                }))
              }
              className="w-full accent-primary h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono text-muted-foreground">
              <span>0đ</span>
              <span>{filters.priceRange[1].toLocaleString("vi-VN")}đ</span>
            </div>
          </div>
        </section>

        {/* Size */}
        <section>
          <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-muted-foreground">
            Kích cỡ
          </h3>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((size) => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center border text-xs font-medium transition-all ${
                  filters.sizes.includes(size)
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border hover:border-primary hover:text-primary"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </section>

        {/* Colors */}
        <section>
          <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-muted-foreground">
            Màu sắc
          </h3>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => toggleColor(color.name)}
                title={color.name}
                className={`w-7 h-7 rounded-full ring-2 ring-offset-2 transition-all ${
                  filters.colors.includes(color.name)
                    ? "ring-primary"
                    : "ring-transparent hover:ring-border"
                } ${color.border ? "border border-border" : ""}`}
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
        </section>

        {/* Material */}
        <section>
          <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-muted-foreground">
            Chất liệu
          </h3>
          <div className="space-y-3">
            {MATERIALS.map((mat) => (
              <label key={mat} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.materials.includes(mat)}
                  onChange={() => toggleMaterial(mat)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {mat}
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

// Sort bar hiển thị phía trên grid
interface SortBarProps {
  showingCount: number;
  totalProducts: number;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export function SortBar({ showingCount, totalProducts, sortBy, onSortChange }: SortBarProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-8 gap-3 bg-muted p-4 rounded-xl">
      <span className="text-sm text-muted-foreground font-medium">
        Đang hiển thị <span className="text-foreground">{showingCount}/{totalProducts}</span> sản phẩm
      </span>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <span className="text-sm font-medium text-muted-foreground">Sắp xếp:</span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-sm font-semibold cursor-pointer py-1 pr-8"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
