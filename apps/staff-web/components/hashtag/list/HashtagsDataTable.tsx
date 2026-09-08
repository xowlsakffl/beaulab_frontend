import React from "react";

import {
  DataTable,
  DataTableSortHeader,
  type DataTableColumn,
  type DataTableMeta,
  StatusValueBadge,
} from "@beaulab/ui-admin";

import { type HashtagRow, type SortField, type SortState } from "@/lib/hashtag/list";
import { ownerVisibilityStatusColor } from "@/lib/common/status-labels";

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
        <DataTableSortHeader
          label="ID"
          active={sortState.enabled && sortState.field === "id"}
          direction={sortState.direction}
          onClick={() => onToggleSort("id")}
        />
      ),
      render: (row) => row.id,
    },
    {
      key: "name",
      headerClassName: `${headerBaseClass} lg:w-[220px]`,
      cellClassName: `${cellBaseClass} lg:w-[220px]`,
      header: (
        <DataTableSortHeader
          label="해시태그명"
          active={sortState.enabled && sortState.field === "name"}
          direction={sortState.direction}
          onClick={() => onToggleSort("name")}
        />
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
        <DataTableSortHeader
          label="고유 검색 키"
          active={sortState.enabled && sortState.field === "normalized_name"}
          direction={sortState.direction}
          onClick={() => onToggleSort("normalized_name")}
        />
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
        <DataTableSortHeader
          label="사용수"
          active={sortState.enabled && sortState.field === "usage_count"}
          direction={sortState.direction}
          onClick={() => onToggleSort("usage_count")}
        />
      ),
      render: (row) => row.usageCount.toLocaleString(),
    },
    {
      key: "status",
      headerClassName: `${headerBaseClass} lg:w-[110px]`,
      cellClassName: `${nowrapCellClass} lg:w-[110px]`,
      header: (
        <DataTableSortHeader
          label="운영상태"
          active={sortState.enabled && sortState.field === "status"}
          direction={sortState.direction}
          onClick={() => onToggleSort("status")}
        />
      ),
      render: (row) => <StatusValueBadge label={row.statusLabel} color={ownerVisibilityStatusColor(row.status)} />,
    },
    {
      key: "updatedAt",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${nowrapCellClass} lg:w-[120px]`,
      header: (
        <DataTableSortHeader
          label="수정일"
          active={sortState.enabled && sortState.field === "updated_at"}
          direction={sortState.direction}
          onClick={() => onToggleSort("updated_at")}
        />
      ),
      render: (row) => row.updatedAt,
    },
    {
      key: "createdAt",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${nowrapCellClass} lg:w-[120px]`,
      header: (
        <DataTableSortHeader
          label="등록일"
          active={sortState.enabled && sortState.field === "created_at"}
          direction={sortState.direction}
          onClick={() => onToggleSort("created_at")}
        />
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
      emptyText="조건에 맞는 해시태그가 없습니다."
    />
  );
}
