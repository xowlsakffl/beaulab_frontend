import React from "react";

import {
  Button,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  DataTable,
  Pagination,
  type DataTableColumn,
  type DataTableMeta,
  StatusValueBadge,
} from "@beaulab/ui-admin";

import { type HashtagRow, type SortField, type SortState } from "@/lib/hashtag/list";
import { ownerVisibilityStatusColor } from "@/lib/common/status-labels";

function renderSortMark(field: SortField, sortState: SortState) {
  if (!sortState.enabled || sortState.field !== field) {
    return <ChevronsUpDown className="size-4" />;
  }

  return sortState.direction === "desc" ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />;
}

function buildHashtagColumns({
  sortState,
  onToggleSort,
}: {
  sortState: SortState;
  onToggleSort: (field: SortField) => void;
}): DataTableColumn<HashtagRow>[] {
  const headerBaseClass = "px-2 py-3 text-left font-semibold text-theme-xs text-gray-600";
  const cellBaseClass = "px-2 py-4 text-start align-top";
  const nowrapCellClass = `${cellBaseClass} overflow-hidden text-ellipsis whitespace-nowrap`;

  return [
    {
      key: "id",
      headerClassName: `${headerBaseClass} lg:w-[70px]`,
      cellClassName: `${nowrapCellClass} lg:w-[70px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("id")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          ID <span className="text-xs text-gray-400">{renderSortMark("id", sortState)}</span>
        </Button>
      ),
      render: (row) => row.id,
    },
    {
      key: "name",
      headerClassName: `${headerBaseClass} lg:w-[220px]`,
      cellClassName: `${cellBaseClass} lg:w-[220px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("name")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          해시태그명 <span className="text-xs text-gray-400">{renderSortMark("name", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <span className="line-clamp-2 block font-medium break-words text-gray-800" title={row.name}>
          #{row.name}
        </span>
      ),
    },
    {
      key: "normalizedName",
      headerClassName: `${headerBaseClass} lg:w-[180px]`,
      cellClassName: `${cellBaseClass} lg:w-[180px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("normalized_name")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          고유 검색 키 <span className="text-xs text-gray-400">{renderSortMark("normalized_name", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{row.normalizedName}</code>
      ),
    },
    {
      key: "usageCount",
      headerClassName: `${headerBaseClass} lg:w-[96px]`,
      cellClassName: `${nowrapCellClass} lg:w-[96px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("usage_count")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          사용수 <span className="text-xs text-gray-400">{renderSortMark("usage_count", sortState)}</span>
        </Button>
      ),
      render: (row) => row.usageCount.toLocaleString(),
    },
    {
      key: "status",
      headerClassName: `${headerBaseClass} lg:w-[110px]`,
      cellClassName: `${nowrapCellClass} lg:w-[110px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("status")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          운영상태 <span className="text-xs text-gray-400">{renderSortMark("status", sortState)}</span>
        </Button>
      ),
      render: (row) => <StatusValueBadge label={row.statusLabel} color={ownerVisibilityStatusColor(row.status)} />,
    },
    {
      key: "updatedAt",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${nowrapCellClass} lg:w-[120px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("updated_at")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          수정일 <span className="text-xs text-gray-400">{renderSortMark("updated_at", sortState)}</span>
        </Button>
      ),
      render: (row) => row.updatedAt,
    },
    {
      key: "createdAt",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${nowrapCellClass} lg:w-[120px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("created_at")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          등록일 <span className="text-xs text-gray-400">{renderSortMark("created_at", sortState)}</span>
        </Button>
      ),
      render: (row) => row.createdAt,
    },
  ];
}

type HashtagsDataTableProps = {
  rows: HashtagRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  highlightedRowId: number | null;
  sortState: SortState;
  onToggleSort: (field: SortField) => void;
  onGoPage: (page: number) => void;
  onRowClick: (row: HashtagRow) => void;
};

export function HashtagsDataTable({
  rows,
  meta,
  loading,
  refreshing,
  error,
  highlightedRowId,
  sortState,
  onToggleSort,
  onGoPage,
  onRowClick,
}: HashtagsDataTableProps) {
  const columns = React.useMemo(() => buildHashtagColumns({ sortState, onToggleSort }), [onToggleSort, sortState]);

  return (
    <DataTable
      tableClassName="w-[1000px] min-w-[1000px] table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      getRowClassName={(row) =>
        row.id === highlightedRowId ? "bg-emerald-50/90 transition-colors duration-500 " : undefined
      }
      loadingVariant="spinner"
      loadingLabel="해시태그 목록 불러오는 중"
      loading={loading}
      refreshing={refreshing}
      error={error}
      meta={meta}

      onGoPage={onGoPage}
      onRowClick={onRowClick}
      footerCenter={
        meta ? (
          <Pagination
            currentPage={meta.current_page}
            totalPages={Math.max(1, meta.last_page)}
            onPageChange={onGoPage}
            disabled={refreshing}
          />
        ) : null
      }
      emptyText="조건에 맞는 해시태그가 없습니다."
    />
  );
}
