"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../ui/button/Button";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

function buildPages(currentPage: number, totalPages: number) {
  const pages: Array<number | "..."> = [];
  if (totalPages <= 7) {
    for (let p = 1; p <= totalPages; p += 1) pages.push(p);
    return pages;
  }

  pages.push(1);
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push("...");
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < totalPages - 1) pages.push("...");

  pages.push(totalPages);
  return pages;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, disabled = false }) => {
  if (totalPages <= 1) return null;

  const pages = React.useMemo(() => buildPages(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage <= 1}
        className="h-9 min-w-9 px-3"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((page, index) => {
        if (page === "...") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="flex h-9 min-w-9 select-none items-center justify-center rounded-lg border border-gray-200 px-3 text-sm text-gray-500 dark:border-white/[0.05] dark:text-gray-400"
            >
              …
            </span>
          );
        }

        const active = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            onClick={active ? undefined : () => onPageChange(page)}
            disabled={disabled || active}
            className={[
              "h-9 min-w-9 rounded-lg border px-3 text-sm font-medium",
              active
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-gray-200 text-gray-800 hover:bg-gray-50 dark:border-white/[0.05] dark:text-white/90 dark:hover:bg-white/[0.06]",
            ].join(" ")}
          >
            {page}
          </button>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage >= totalPages}
        className="h-9 min-w-9 px-3"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Pagination;
