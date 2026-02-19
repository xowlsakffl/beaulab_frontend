"use client";

import React from "react";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import Button from "../ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";

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
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  skeletonRows?: number;
  meta?: DataTableMeta | null;
  onGoPage?: (page: number) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onRowClick?: (row: T) => void;
  paginationWindow?: number;
};

type PageItem =
  | { type: "page"; page: number; active: boolean }
  | { type: "ellipsis"; key: string };

const DEFAULT_HEADER_CELL =
  "px-5 py-3 font-semibold text-gray-600 text-left text-theme-xs dark:text-gray-300";

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}

function Skeleton({ className = "h-4 w-[70%]" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200/80 dark:bg-gray-700/70 ${className}`} />;
}

function buildPageItems(current: number, last: number, windowSize: number): PageItem[] {
  if (last <= 1) return [{ type: "page", page: 1, active: true }];

  const safeWindow = Math.max(5, windowSize);
  const half = Math.floor(safeWindow / 2);

  let start = Math.max(1, current - half);
  let end = Math.min(last, current + half);

  const span = end - start + 1;
  if (span < safeWindow) {
    const shortage = safeWindow - span;
    start = Math.max(1, start - shortage);
    end = Math.min(last, end + shortage);
  }

  const span2 = end - start + 1;
  if (span2 < safeWindow) {
    if (start === 1) end = Math.min(last, start + safeWindow - 1);
    else if (end === last) start = Math.max(1, end - safeWindow + 1);
  }

  const items: PageItem[] = [];

  if (start > 1) {
    items.push({ type: "page", page: 1, active: current === 1 });
    if (start > 2) items.push({ type: "ellipsis", key: "left-ellipsis" });
  }

  for (let p = start; p <= end; p += 1) {
    if (p === 1 && start > 1) continue;
    if (p === last && end < last) continue;
    items.push({ type: "page", page: p, active: p === current });
  }

  if (end < last) {
    if (end < last - 1) items.push({ type: "ellipsis", key: "right-ellipsis" });
    items.push({ type: "page", page: last, active: current === last });
  }

  const normalized: PageItem[] = [];
  const seenPage = new Set<number>();
  for (const item of items) {
    if (item.type === "page") {
      if (seenPage.has(item.page)) continue;
      seenPage.add(item.page);
    }
    normalized.push(item);
  }

  return normalized;
}

export function DataTable<T>({
  title,
  description,
  rightActions,
  columns,
  rows,
  getRowKey,
  loading = false,
  error = null,
  emptyText = "데이터가 없습니다.",
  skeletonRows = 6,
  meta = null,
  onGoPage,
  onRefresh,
  refreshing = false,
  onRowClick,
  paginationWindow = 7,
}: DataTableProps<T>) {
  const colCount = Math.max(1, columns.length);
  const current = meta?.current_page ?? 1;
  const last = meta?.last_page ?? 1;

  const pageItems = React.useMemo(() => {
    if (!meta) return [];
    return buildPageItems(current, meta.last_page, paginationWindow);
  }, [meta, current, paginationWindow]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {(title || description || rightActions || onRefresh) && (
        <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-4">
          <div>{title ? <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3> : null}{description ? <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{description}</p> : null}</div>

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

      <div className="max-w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <Table className="w-max min-w-full">
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
                <TableCell className="px-5 py-6 text-start text-theme-sm text-rose-600" colSpan={colCount}>
                  {error}
                </TableCell>
              </TableRow>
            ) : null}

            {loading
              ? Array.from({ length: skeletonRows }).map((_, rowIndex) => (
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
              ? rows.map((row) => (
                  <TableRow
                    key={getRowKey(row)}
                    className={onRowClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03]" : undefined}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.cellClassName ?? "px-5 py-4 text-start sm:px-6 dark:text-gray-200"}>
                        {column.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>
      </div>

      {meta && onGoPage ? (
        <div className="flex items-center justify-end px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            {current > 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGoPage(current - 1)}
                disabled={refreshing}
                className="h-9 min-w-9 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-white/[0.05] dark:text-white/90 dark:hover:bg-white/[0.06]"
              >
                <ChevronLeft />
              </Button>
            ) : null}

            {pageItems.map((item) => {
              if (item.type === "ellipsis") {
                return (
                  <span
                    key={item.key}
                    className="flex h-9 min-w-9 select-none items-center justify-center rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-500 dark:border-white/[0.05] dark:text-gray-400"
                    aria-hidden
                  >
                    …
                  </span>
                );
              }

              const active = item.active;
              return (
                <button
                  key={item.page}
                  type="button"
                  onClick={active ? undefined : () => onGoPage(item.page)}
                  disabled={refreshing || active}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "h-9 min-w-9 rounded-lg border px-3 text-sm font-medium",
                    "border-gray-200 text-gray-800 dark:border-white/[0.05] dark:text-white/90",
                    active
                      ? "pointer-events-none cursor-default bg-brand-500 text-white"
                      : "bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.06]",
                    refreshing ? "opacity-60" : "",
                  ].join(" ")}
                >
                  {item.page}
                </button>
              );
            })}

            {current < last ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGoPage(current + 1)}
                disabled={refreshing}
                className="h-9 min-w-9 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-white/[0.05] dark:text-white/90 dark:hover:bg-white/[0.06]"
              >
                <ChevronRight />
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DataTable;
