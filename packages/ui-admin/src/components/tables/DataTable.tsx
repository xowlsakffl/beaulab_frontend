"use client";

import React from "react";
import { RotateCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
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
};

const DEFAULT_HEADER_CELL =
  "px-5 py-3 font-semibold text-gray-600 text-left text-theme-xs dark:text-gray-300";

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}

function Skeleton({ className = "h-4 w-[70%]" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200/80 dark:bg-gray-700/70 ${className}`} />;
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
}: DataTableProps<T>) {
  const colCount = Math.max(1, columns.length);
  const totalPages = Number(meta?.last_page ?? 0);
  const shouldShowPagination = Boolean(meta && onGoPage && Number.isFinite(totalPages) && totalPages > 1);
  const handlePageChange = onGoPage ?? (() => undefined);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
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
                <TableCell className="px-5 py-6 text-center text-theme-sm text-rose-600" colSpan={colCount}>
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

      {shouldShowPagination && meta ? (
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">총 {meta.total.toLocaleString()}개</div>
          <Pagination
            currentPage={meta.current_page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            disabled={refreshing}
          />
        </div>
      ) : null}
    </div>
  );
}

export default DataTable;
