import React from "react";

import {
  Button,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  DataTable,
  Select,
  StatusBadge,
  type DataTableColumn,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import {
  PER_PAGE_OPTIONS,
  labelHashtagStatus,
  type HashtagRow,
  type SortField,
  type SortState,
} from "@/lib/hashtag/list";

function renderSortMark(field: SortField, sortState: SortState) {
  if (!sortState.enabled || sortState.field !== field) {
    return <ChevronsUpDown className="size-4" />;
  }

  return sortState.direction === "desc"
    ? <ChevronDown className="size-4" />
    : <ChevronUp className="size-4" />;
}

function buildHashtagColumns({
  sortState,
  onToggleSort,
}: {
  sortState: SortState;
  onToggleSort: (field: SortField) => void;
}): DataTableColumn<HashtagRow>[] {
  const headerBaseClass = "px-3 py-3 text-left font-semibold text-gray-600 text-theme-xs dark:text-gray-300";
  const cellBaseClass = "px-3 py-4 text-start align-top dark:text-gray-200";
  const nowrapCellClass = `${cellBaseClass} whitespace-nowrap`;

  return [
    {
      key: "id",
      headerClassName: `${headerBaseClass} lg:w-[72px]`,
      cellClassName: `${nowrapCellClass} lg:w-[72px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("id")} className="inline-flex items-center gap-1 px-0 text-xs">
          ID <span className="text-xs text-gray-400">{renderSortMark("id", sortState)}</span>
        </Button>
      ),
      render: (row) => row.id,
    },
    {
      key: "name",
      headerClassName: `${headerBaseClass} lg:w-[180px]`,
      cellClassName: `${cellBaseClass} lg:w-[180px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("name")} className="inline-flex items-center gap-1 px-0 text-xs">
          해시태그명 <span className="text-xs text-gray-400">{renderSortMark("name", sortState)}</span>
        </Button>
      ),
      render: (row) => <span className="font-medium text-gray-800 dark:text-white/90">#{row.name}</span>,
    },
    {
      key: "normalizedName",
      headerClassName: `${headerBaseClass} lg:w-[180px]`,
      cellClassName: `${cellBaseClass} lg:w-[180px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("normalized_name")} className="inline-flex items-center gap-1 px-0 text-xs">
          고유 검색 키 <span className="text-xs text-gray-400">{renderSortMark("normalized_name", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
          {row.normalizedName}
        </code>
      ),
    },
    {
      key: "assignmentCount",
      headerClassName: `${headerBaseClass} lg:w-[96px]`,
      cellClassName: `${nowrapCellClass} lg:w-[96px]`,
      header: "연결 수",
      render: (row) => row.assignmentCount.toLocaleString(),
    },
    {
      key: "status",
      headerClassName: `${headerBaseClass} lg:w-[110px]`,
      cellClassName: `${nowrapCellClass} lg:w-[110px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("status")} className="inline-flex items-center gap-1 px-0 text-xs">
          운영상태 <span className="text-xs text-gray-400">{renderSortMark("status", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <StatusBadge size="sm" color={row.status === "ACTIVE" ? "success" : "warning"}>
          {labelHashtagStatus(row.status)}
        </StatusBadge>
      ),
    },
    {
      key: "updatedAt",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${nowrapCellClass} lg:w-[120px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("updated_at")} className="inline-flex items-center gap-1 px-0 text-xs">
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
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("created_at")} className="inline-flex items-center gap-1 px-0 text-xs">
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
  perPage: number;
  onToggleSort: (field: SortField) => void;
  onRefresh: () => void;
  onGoPage: (page: number) => void;
  onPerPageChange: (value: number) => void;
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
  perPage,
  onToggleSort,
  onRefresh,
  onGoPage,
  onPerPageChange,
  onRowClick,
}: HashtagsDataTableProps) {
  const columns = React.useMemo(
    () => buildHashtagColumns({ sortState, onToggleSort }),
    [onToggleSort, sortState],
  );

  return (
    <DataTable
      title="해시태그 목록"
      description="종합검색은 입력 시 자동 반영되며, 필터는 '필터 적용' 버튼으로 적용됩니다."
      tableClassName="min-w-[1020px] w-full lg:min-w-0 lg:table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      getRowClassName={(row) =>
        row.id === highlightedRowId
          ? "bg-emerald-50/90 transition-colors duration-500 dark:bg-emerald-500/10"
          : undefined
      }
      loadingVariant="spinner"
      loadingLabel="해시태그 목록 불러오는 중"
      loading={loading}
      refreshing={refreshing}
      error={error}
      meta={meta}
      onRefresh={onRefresh}
      onGoPage={onGoPage}
      onRowClick={onRowClick}
      rightActions={(
        <div className="flex items-center gap-2">
          <Select
            defaultValue={String(perPage)}
            options={PER_PAGE_OPTIONS}
            showPlaceholderOption={false}
            onChange={(value) => onPerPageChange(Number(value))}
            placeholder="개수 선택"
            className="w-[70px] px-2 text-xs"
          />
        </div>
      )}
      emptyText="조건에 맞는 해시태그가 없습니다."
    />
  );
}
