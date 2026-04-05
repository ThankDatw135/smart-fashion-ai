"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getVisiblePages = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav className="mt-12 lg:mt-16 flex justify-center items-center gap-1.5">
      {/* Prev */}
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange?.(currentPage - 1)}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Pages */}
      {getVisiblePages().map((page, i) =>
        page === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-muted-foreground">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange?.(page)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
              page === currentPage
                ? "bg-primary text-primary-foreground shadow-md"
                : "hover:bg-muted"
            }`}
          >
            {page}
          </button>
        )
      )}

      {/* Next label */}
      {currentPage < totalPages && (
        <button
          onClick={() => onPageChange?.(currentPage + 1)}
          className="px-4 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-all text-sm font-medium"
        >
          Kế tiếp
        </button>
      )}

      {/* Next arrow */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange?.(currentPage + 1)}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
}
