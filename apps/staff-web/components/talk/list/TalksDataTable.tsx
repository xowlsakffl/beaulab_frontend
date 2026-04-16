import React from "react";

import {
  Button,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  DataTable,
  FormCheckbox,
  StatusBadge,
  type DataTableColumn,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import {
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

function SortHeader({
  field,
  label,
  sortState,
  onToggleSort,
}: {
  field: SortField;
  label: string;
  sortState: SortState;
  onToggleSort: (field: SortField) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onToggleSort(field)}
      className="inline-flex items-center gap-1 px-0 text-xs"
    >
      {label}
      <span className="text-xs text-gray-400">{renderSortMark(field, sortState)}</span>
    </Button>
  );
}

function SelectionCheckbox({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <FormCheckbox
      ariaLabel={label}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className="size-4"
    />
  );
}

function buildTalkColumns({
  sortState,
  selectedIds,
  allPageRowsSelected,
  hasRows,
  onToggleSort,
  onToggleRow,
  onToggleAllRows,
}: {
  sortState: SortState;
  selectedIds: Set<number>;
  allPageRowsSelected: boolean;
  hasRows: boolean;
  onToggleSort: (field: SortField) => void;
  onToggleRow: (id: number, checked: boolean) => void;
  onToggleAllRows: (checked: boolean) => void;
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
      key: "select",
      headerClassName: `${headerBaseClass} lg:w-[44px]`,
      cellClassName: `${nowrapCellClass} lg:w-[44px]`,
      header: (
        <SelectionCheckbox
          label="현재 페이지 토크 전체 선택"
          checked={hasRows && allPageRowsSelected}
          disabled={!hasRows}
          onChange={onToggleAllRows}
        />
      ),
      render: (row) => (
        <SelectionCheckbox
          label={`토크 ${row.id} 선택`}
          checked={selectedIds.has(row.id)}
          onChange={(checked) => onToggleRow(row.id, checked)}
        />
      ),
    },
    {
      key: "id",
      headerClassName: `${headerBaseClass} lg:w-[72px]`,
      cellClassName: `${nowrapCellClass} lg:w-[72px]`,
      header: <SortHeader field="id" label="ID" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.id,
    },
    {
      key: "createdAt",
      headerClassName: `${headerBaseClass} lg:w-[116px]`,
      cellClassName: `${nowrapCellClass} lg:w-[116px]`,
      header: <SortHeader field="created_at" label="작성일" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.createdAt,
    },
    {
      key: "category",
      headerClassName: `${headerBaseClass} lg:w-[160px]`,
      cellClassName: `${cellBaseClass} lg:w-[160px]`,
      header: "카테고리",
      render: (row) => (
        <div className="whitespace-normal break-words text-sm leading-6 text-gray-700 dark:text-gray-200">
          {row.categoryNames.length > 0 ? row.categoryNames.join(", ") : "-"}
        </div>
      ),
    },
    {
      key: "title",
      headerClassName: `${headerBaseClass} lg:w-[210px]`,
      cellClassName: `${cellBaseClass} lg:w-[210px]`,
      header: <SortHeader field="title" label="제목" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => (
        <span className="block whitespace-normal break-words font-medium text-gray-800 dark:text-white/90" style={twoLineClampStyle}>
          {row.title}
        </span>
      ),
    },
    {
      key: "content",
      headerClassName: `${headerBaseClass} lg:w-[260px]`,
      cellClassName: `${cellBaseClass} lg:w-[260px]`,
      header: "내용",
      render: (row) => (
        <div className="whitespace-normal break-words text-sm leading-6 text-gray-600 dark:text-gray-300" style={twoLineClampStyle}>
          {row.contentPreview || "-"}
        </div>
      ),
    },
    {
      key: "isVisible",
      headerClassName: `${headerBaseClass} lg:w-[100px]`,
      cellClassName: `${nowrapCellClass} lg:w-[100px]`,
      header: <SortHeader field="is_visible" label="노출여부" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => (
        <StatusBadge size="sm" color={row.isVisible ? "success" : "error"}>
          {row.isVisible ? "노출" : "미노출"}
        </StatusBadge>
      ),
    },
    {
      key: "likeCount",
      headerClassName: `${headerBaseClass} lg:w-[96px]`,
      cellClassName: `${nowrapCellClass} lg:w-[96px]`,
      header: <SortHeader field="like_count" label="좋아요수" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.likeCount.toLocaleString(),
    },
    {
      key: "saveCount",
      headerClassName: `${headerBaseClass} lg:w-[88px]`,
      cellClassName: `${nowrapCellClass} lg:w-[88px]`,
      header: <SortHeader field="save_count" label="저장수" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.saveCount.toLocaleString(),
    },
    {
      key: "commentCount",
      headerClassName: `${headerBaseClass} lg:w-[88px]`,
      cellClassName: `${nowrapCellClass} lg:w-[88px]`,
      header: <SortHeader field="comment_count" label="댓글수" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.commentCount.toLocaleString(),
    },
    {
      key: "viewCount",
      headerClassName: `${headerBaseClass} lg:w-[88px]`,
      cellClassName: `${nowrapCellClass} lg:w-[88px]`,
      header: <SortHeader field="view_count" label="조회수" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.viewCount.toLocaleString(),
    },
    {
      key: "status",
      headerClassName: `${headerBaseClass} lg:w-[88px]`,
      cellClassName: `${nowrapCellClass} lg:w-[88px]`,
      header: <SortHeader field="status" label="상태" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => (
        <StatusBadge size="sm" color={row.status === "ACTIVE" ? "success" : "warning"}>
          {labelTalkStatus(row.status)}
        </StatusBadge>
      ),
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
  selectedIds: Set<number>;
  bulkUpdating: boolean;
  onToggleSort: (field: SortField) => void;
  onToggleRow: (id: number, checked: boolean) => void;
  onToggleAllRows: (checked: boolean) => void;
  onBulkVisibilityChange: (isVisible: boolean) => void;
  onRefresh: () => void;
  onGoPage: (page: number) => void;
};

export function TalksDataTable({
  rows,
  meta,
  loading,
  refreshing,
  error,
  sortState,
  selectedIds,
  bulkUpdating,
  onToggleSort,
  onToggleRow,
  onToggleAllRows,
  onBulkVisibilityChange,
  onRefresh,
  onGoPage,
}: TalksDataTableProps) {
  const selectedCount = selectedIds.size;
  const allPageRowsSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id));
  const columns = React.useMemo(
    () => buildTalkColumns({
      sortState,
      selectedIds,
      allPageRowsSelected,
      hasRows: rows.length > 0,
      onToggleSort,
      onToggleRow,
      onToggleAllRows,
    }),
    [allPageRowsSelected, onToggleAllRows, onToggleRow, onToggleSort, rows.length, selectedIds, sortState],
  );

  return (
    <DataTable
      tableClassName="min-w-[1460px] w-full lg:min-w-0 lg:table-fixed"
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
      refreshPlacement="left"
      onGoPage={onGoPage}
      rightActions={(
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={selectedCount === 0 || bulkUpdating || loading || refreshing}
            onClick={() => onBulkVisibilityChange(true)}
            className="h-9 px-3 text-xs"
          >
            노출
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={selectedCount === 0 || bulkUpdating || loading || refreshing}
            onClick={() => onBulkVisibilityChange(false)}
            className="h-9 px-3 text-xs"
          >
            미노출
          </Button>
        </div>
      )}
      emptyText="조건에 맞는 토크가 없습니다."
    />
  );
}
