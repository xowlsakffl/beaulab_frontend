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
  labelTalkStatus,
  type SortField,
  type SortState,
  type TalkRow,
} from "@/lib/talk/list";

function renderSortMark(field: SortField, sortState: SortState) {
  if (!sortState.enabled || sortState.field !== field) {
    return <ChevronsUpDown className="size-4" />;
  }

  return sortState.direction === "desc"
    ? <ChevronDown className="size-4" />
    : <ChevronUp className="size-4" />;
}

function buildTalkColumns({
  sortState,
  onToggleSort,
}: {
  sortState: SortState;
  onToggleSort: (field: SortField) => void;
}): DataTableColumn<TalkRow>[] {
  const headerBaseClass = "px-3 py-3 text-left font-semibold text-gray-600 text-theme-xs dark:text-gray-300";
  const cellBaseClass = "px-3 py-4 text-start align-top dark:text-gray-200";
  const nowrapCellClass = `${cellBaseClass} whitespace-nowrap`;
  const twoLineClampStyle: React.CSSProperties = {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

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
      key: "category",
      headerClassName: `${headerBaseClass} lg:w-[180px]`,
      cellClassName: `${cellBaseClass} lg:w-[180px]`,
      header: "카테고리",
      render: (row) => (
        <div className="whitespace-normal break-words text-sm leading-6 text-gray-700 dark:text-gray-200">
          {row.categoryNames.length > 0 ? row.categoryNames.join(", ") : "-"}
        </div>
      ),
    },
    {
      key: "title",
      headerClassName: `${headerBaseClass} lg:w-[220px]`,
      cellClassName: `${cellBaseClass} lg:w-[220px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("title")} className="inline-flex items-center gap-1 px-0 text-xs">
          제목 <span className="text-xs text-gray-400">{renderSortMark("title", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <span className="block whitespace-normal break-words font-medium text-gray-800 dark:text-white/90" style={twoLineClampStyle}>
          {row.title}
        </span>
      ),
    },
    {
      key: "content",
      headerClassName: `${headerBaseClass} lg:w-[280px]`,
      cellClassName: `${cellBaseClass} lg:w-[280px]`,
      header: "내용",
      render: (row) => (
        <div className="whitespace-normal break-words text-sm leading-6 text-gray-600 dark:text-gray-300" style={twoLineClampStyle}>
          {row.contentPreview || "-"}
        </div>
      ),
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
          {labelTalkStatus(row.status)}
        </StatusBadge>
      ),
    },
    {
      key: "nickname",
      headerClassName: `${headerBaseClass} lg:w-[150px]`,
      cellClassName: `${cellBaseClass} lg:w-[150px]`,
      header: "닉네임",
      render: (row) => row.nickname,
    },
    {
      key: "viewCount",
      headerClassName: `${headerBaseClass} lg:w-[96px]`,
      cellClassName: `${nowrapCellClass} lg:w-[96px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("view_count")} className="inline-flex items-center gap-1 px-0 text-xs">
          조회수 <span className="text-xs text-gray-400">{renderSortMark("view_count", sortState)}</span>
        </Button>
      ),
      render: (row) => row.viewCount.toLocaleString(),
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

type TalksDataTableProps = {
  rows: TalkRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  sortState: SortState;
  perPage: number;
  onToggleSort: (field: SortField) => void;
  onRefresh: () => void;
  onGoPage: (page: number) => void;
  onPerPageChange: (value: number) => void;
};

export function TalksDataTable({
  rows,
  meta,
  loading,
  refreshing,
  error,
  sortState,
  perPage,
  onToggleSort,
  onRefresh,
  onGoPage,
  onPerPageChange,
}: TalksDataTableProps) {
  const columns = React.useMemo(
    () => buildTalkColumns({ sortState, onToggleSort }),
    [onToggleSort, sortState],
  );

  return (
    <DataTable
      title="토크 목록"
      description="검색어는 자동 반영되고, 등록일/운영상태/카테고리는 '필터 적용' 버튼으로 반영됩니다."
      tableClassName="min-w-[1420px] w-full lg:min-w-0 lg:table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      loadingVariant="spinner"
      loadingLabel="토크 목록 불러오는 중"
      loading={loading}
      refreshing={refreshing}
      error={error}
      meta={meta}
      onRefresh={onRefresh}
      onGoPage={onGoPage}
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
      emptyText="조건에 맞는 토크가 없습니다."
    />
  );
}
