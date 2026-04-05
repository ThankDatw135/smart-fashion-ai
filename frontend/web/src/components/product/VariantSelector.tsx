"use client";

import { useState } from "react";
import { Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ---------- Types ---------- */
interface ColorOption {
  name: string;
  value: string;
  border?: boolean;
}

interface VariantSelectorProps {
  colors: ColorOption[];
  sizes: string[];
  unavailableSizes?: string[];
  selectedColor?: string;
  selectedSize?: string;
  onColorChange?: (color: string) => void;
  onSizeChange?: (size: string) => void;
  onSizeChartOpen?: () => void;
}

/* ---------- Component ---------- */
export function VariantSelector({
  colors,
  sizes,
  unavailableSizes = [],
  selectedColor: controlledColor,
  selectedSize: controlledSize,
  onColorChange,
  onSizeChange,
  onSizeChartOpen,
}: VariantSelectorProps) {
  const [internalColor, setInternalColor] = useState(colors[0]?.name ?? "");
  const [internalSize, setInternalSize] = useState(sizes[0] ?? "");

  const activeColor = controlledColor ?? internalColor;
  const activeSize = controlledSize ?? internalSize;

  const handleColor = (name: string) => {
    setInternalColor(name);
    onColorChange?.(name);
  };

  const handleSize = (size: string) => {
    if (unavailableSizes.includes(size)) return;
    setInternalSize(size);
    onSizeChange?.(size);
  };

  return (
    <div className="space-y-8">
      {/* Color selection */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-4">
          Chọn màu sắc:{" "}
          <span className="text-primary font-normal normal-case tracking-normal">
            {activeColor}
          </span>
        </p>
        <div className="flex gap-3">
          {colors.map((c) => (
            <button
              key={c.name}
              title={c.name}
              onClick={() => handleColor(c.name)}
              className={`w-10 h-10 rounded-full ring-2 ring-offset-2 transition-all ${
                activeColor === c.name ? "ring-primary" : "ring-transparent hover:ring-border"
              } ${c.border ? "border border-border" : ""}`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      </div>

      {/* Size selection */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs font-bold uppercase tracking-widest">
            Kích cỡ:{" "}
            <span className="text-primary font-normal normal-case tracking-normal">
              {activeSize}
            </span>
          </p>
          <button
            onClick={onSizeChartOpen}
            className="text-primary text-xs font-bold underline hover:no-underline transition-all"
          >
            Bảng số đo
          </button>
        </div>
        <div className="flex gap-3">
          {sizes.map((size) => {
            const isUnavailable = unavailableSizes.includes(size);
            const isActive = activeSize === size;

            return (
              <button
                key={size}
                onClick={() => handleSize(size)}
                disabled={isUnavailable}
                className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-sm transition-all relative overflow-hidden ${
                  isUnavailable
                    ? "border border-border opacity-30 cursor-not-allowed"
                    : isActive
                    ? "bg-primary text-primary-foreground border border-primary shadow-sm"
                    : "border border-border hover:border-primary"
                }`}
              >
                {size}
                {isUnavailable && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-px bg-foreground rotate-45" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Size Suggestion CTA */}
      <div className="glass-card p-4 lg:p-5 rounded-2xl border border-white/50 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Ruler className="h-5 w-5" />
          </div>
          <div>
            <p className="font-heading font-bold text-sm">AI Đoán Size</p>
            <p className="text-xs text-muted-foreground">Dựa trên số đo cơ thể của bạn</p>
          </div>
        </div>
        <Button size="sm" className="rounded-full text-xs font-bold shrink-0">
          Kiểm tra ngay
        </Button>
      </div>
    </div>
  );
}
