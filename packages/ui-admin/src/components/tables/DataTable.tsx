"use client";

import React from "react";
import { RotateCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import { Spinner } from "../ui/spinner/Spinner";
import Pagination from "./Pagination";

export type DataTableColumn<T> = {
  key: string;
  header: React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T) => React.ReactNode;
};

export type DataTableMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

type DataTableProps<T> = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  rightActions?: React.ReactNode;
  tableClassName?: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
  loading?: boolean;
  loadingVariant?: "skeleton" | "spinner";
  loadingLabel?: string;
  error?: string | null;
  emptyText?: string;
  skeletonRows?: number;
  meta?: DataTableMeta | null;
  onGoPage?: (page: number) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string | undefined;
};

const DEFAULT_HEADER_CELL =
  "px-5 py-3 font-semibold text-gray-600 text-left text-theme-xs dark:text-gray-300";

function Skeleton({ className = "h-4 w-[70%]" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200/80 dark:bg-gray-700/70 ${className}`} />;
}

export function DataTable<T>({
  title,
  description,
  rightActions,
  tableClassName,
  columns,
  rows,
  getRowKey,
  loading = false,
  loadingVariant = "skeleton",
  loadingLabel = "로딩 중",
  error = null,
  emptyText = "데이터가 없습니다.",
  skeletonRows = 6,
  meta = null,
  onGoPage,
  onRefresh,
  refreshing = false,
  onRowClick,
  getRowClassName,
}: DataTableProps<T>) {
  const colCount = Math.max(1, columns.length);
  const totalPages = Number(meta?.last_page ?? 0);
  const shouldShowFooter = Boolean(meta);
  const handlePageChange = onGoPage ?? (() => undefined);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [showRightScrollHint, setShowRightScrollHint] = React.useState(false);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateScrollHint = () => {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      setShowRightScrollHint(maxScrollLeft > 8 && container.scrollLeft < maxScrollLeft - 8);
    };

    const frameId = window.requestAnimationFrame(updateScrollHint);
    container.addEventListener("scroll", updateScrollHint, { passive: true });
    window.addEventListener("resize", updateScrollHint);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateScrollHint);
      resizeObserver.observe(container);

      const tableElement = container.querySelector("table");
      if (tableElement instanceof HTMLElement) {
        resizeObserver.observe(tableElement);
      }
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      container.removeEventListener("scroll", updateScrollHint);
      window.removeEventListener("resize", updateScrollHint);
      resizeObserver?.disconnect();
    };
  }, [columns.length, error, loading, rows.length]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {(title || description || rightActions || onRefresh) && (
        <div className="lg:flex lg:items-center lg:justify-between gap-3 px-4 py-4 sm:px-4">
          <div className="mb-3 lg:mb-0">
            {title ? <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3> : null}
            {description ? <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{description}</p> : null}
          </div>

          <div className="flex items-center gap-3">
            {onRefresh ? (
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={refreshing}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-white/[0.05] dark:text-white/90 dark:hover:bg-white/[0.06]"
                    title="새로고침"
                >
                  {refreshing ? <Spinner className="h-4 w-4" /> : <RotateCw className="h-4 w-4" />}
                </button>
            ) : null}
            {rightActions}
          </div>
        </div>
      )}

      <div className="relative">
        <div ref={scrollContainerRef} className="max-w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          <Table className={tableClassName ?? "w-max min-w-full"}>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.key} isHeader className={column.headerClassName ?? DEFAULT_HEADER_CELL}>
                    {column.header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {!loading && error ? (
                <TableRow>
                  <TableCell className="px-5 py-6 text-center text-theme-sm text-rose-600" colSpan={colCount}>
                    {error}
                  </TableCell>
                </TableRow>
              ) : null}

              {loading
                ? loadingVariant === "spinner"
                  ? (
                    <TableRow>
                      <TableCell className="px-5 py-16" colSpan={colCount}>
                        <div className="flex items-center justify-center">
                          <Spinner className="size-8 text-brand-500 dark:text-brand-400" label={loadingLabel} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                  : Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                      <TableRow key={`sk-${rowIndex}`}>
                        {columns.map((column, cellIndex) => (
                          <TableCell key={`${column.key}-${cellIndex}`} className={column.cellClassName ?? "px-5 py-4 text-start sm:px-6"}>
                            <Skeleton className="h-4 w-[70%]" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                : null}

              {!loading && !error && rows.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-10 text-center text-theme-sm text-gray-500 dark:text-gray-400" colSpan={colCount}>
                    {emptyText}
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading && !error
                ? rows.map((row) => {
                    const rowClassName =
                      [
                        onRowClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03]" : "",
                        getRowClassName?.(row) ?? "",
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined;

                    return (
                    <TableRow
                      key={getRowKey(row)}
                      className={rowClassName}
                      onClick={() => onRowClick?.(row)}
                    >
                      {columns.map((column) => (
                        <TableCell key={column.key} className={column.cellClassName ?? "px-5 py-4 text-start sm:px-6 dark:text-gray-200"}>
                          {column.render(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                    );
                  })
                : null}
            </TableBody>
          </Table>
        </div>

      </div>

      {shouldShowFooter && meta ? (
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            총 {meta.total.toLocaleString()}개 · {meta.current_page} / {Math.max(1, totalPages)} 페이지
          </div>
          <Pagination
            currentPage={meta.current_page}
            totalPages={Math.max(1, totalPages)}
            onPageChange={handlePageChange}
            disabled={refreshing || !onGoPage}
          />
        </div>
      ) : null}

      {showRightScrollHint ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-2 border-r border-slate-900/12 bg-gradient-to-l from-slate-900/14 via-slate-900/6 to-transparent dark:border-black/30 dark:from-black/36 dark:via-black/14"
        />
      ) : null}
    </div>
  );
}

export default DataTable;
