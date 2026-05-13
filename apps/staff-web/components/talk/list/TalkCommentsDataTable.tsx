import React from "react";

import {
  Button,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  DataTable,
  FormCheckbox,
  StatusBadge,
  Switch,
  type DataTableColumn,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import {
  type TalkCommentRow,
  type TalkCommentSortField,
  type TalkCommentSortState,
} from "@/lib/talk/comment-list";
import { labelTalkPostStatus, talkPostStatusBadgeColor } from "@/lib/talk/list";

function renderSortMark(field: TalkCommentSortField, sortState: TalkCommentSortState) {
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
  field: TalkCommentSortField;
  label: string;
  sortState: TalkCommentSortState;
  onToggleSort: (field: TalkCommentSortField) => void;
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

function buildCommentColumns({
  sortState,
  selectedIds,
  allPageRowsSelected,
  hasSelectableRows,
  visibilityUpdatingIds,
  visibilityControlsDisabled,
  onToggleSort,
  onToggleRow,
  onToggleAllRows,
  onRowVisibilityChange,
}: {
  sortState: TalkCommentSortState;
  selectedIds: Set<number>;
  allPageRowsSelected: boolean;
  hasSelectableRows: boolean;
  visibilityUpdatingIds: Set<number>;
  visibilityControlsDisabled: boolean;
  onToggleSort: (field: TalkCommentSortField) => void;
  onToggleRow: (id: number, checked: boolean) => void;
  onToggleAllRows: (checked: boolean) => void;
  onRowVisibilityChange: (id: number, status: string) => void;
}): DataTableColumn<TalkCommentRow>[] {
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
      headerClassName: `${headerBaseClass} lg:w-[40px]`,
      cellClassName: `${nowrapCellClass} lg:w-[40px]`,
      header: (
        <SelectionCheckbox
          label="현재 페이지 토크 댓글 전체 선택"
          checked={hasSelectableRows && allPageRowsSelected}
          disabled={!hasSelectableRows || visibilityControlsDisabled}
          onChange={onToggleAllRows}
        />
      ),
      render: (row) => (
        <SelectionCheckbox
          label={`토크 댓글 ${row.id} 선택`}
          checked={selectedIds.has(row.id)}
          disabled={visibilityControlsDisabled || row.visibilityChangeLocked}
          onChange={(checked) => onToggleRow(row.id, checked)}
        />
      ),
    },
    {
      key: "id",
      headerClassName: `${headerBaseClass} lg:w-[72px]`,
      cellClassName: `${nowrapCellClass} lg:w-[72px]`,
      header: <SortHeader field="id" label="댓글ID" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.id,
    },
    {
      key: "createdAt",
      headerClassName: `${headerBaseClass} lg:w-[104px]`,
      cellClassName: `${nowrapCellClass} lg:w-[104px]`,
      header: <SortHeader field="created_at" label="댓글 작성일" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.createdAt,
    },
    {
      key: "categoryName",
      headerClassName: `${headerBaseClass} min-w-[170px] lg:min-w-0 lg:w-[132px]`,
      cellClassName: `${cellBaseClass} min-w-[170px] lg:min-w-0 lg:w-[132px]`,
      header: "토크유형",
      render: (row) => (
        <div className="whitespace-normal break-words text-sm leading-6 text-gray-700 dark:text-gray-200">
          {row.categoryName}
        </div>
      ),
    },
    {
      key: "nickname",
      headerClassName: `${headerBaseClass} lg:w-[116px]`,
      cellClassName: `${cellBaseClass} lg:w-[116px]`,
      header: "댓글 닉네임",
      render: (row) => (
        <span className="block whitespace-normal break-words text-sm text-gray-700 dark:text-gray-200">
          {row.nickname}
        </span>
      ),
    },
    {
      key: "content",
      headerClassName: `${headerBaseClass} lg:w-[260px]`,
      cellClassName: `${cellBaseClass} lg:w-[260px]`,
      header: "댓글 내용",
      render: (row) => (
        <div
          className="whitespace-normal break-words text-sm leading-6 text-gray-600 dark:text-gray-300"
          style={twoLineClampStyle}
        >
          {row.mentionText && (
            <span className="mr-1 font-semibold text-brand-500 dark:text-brand-400">
              @{row.mentionText}
            </span>
          )}
          <span>{row.contentPreview || "-"}</span>
        </div>
      ),
    },
    {
      key: "parentTalkTitle",
      headerClassName: `${headerBaseClass} lg:w-[220px]`,
      cellClassName: `${cellBaseClass} lg:w-[220px]`,
      header: "토크 제목",
      render: (row) => (
        <span
          className="block whitespace-normal break-words font-medium text-gray-800 dark:text-white/90"
          style={twoLineClampStyle}
        >
          {row.parentTalkTitle}
        </span>
      ),
    },
    {
      key: "status",
      headerClassName: `${headerBaseClass} lg:w-[90px]`,
      cellClassName: `${nowrapCellClass} lg:w-[90px]`,
      header: <SortHeader field="status" label="노출여부" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => (
        <Switch
          ariaLabel={`토크 댓글 ${row.id} ${row.isVisible ? "미노출로 변경" : "노출로 변경"}`}
          checked={row.isVisible}
          color="gray"
          disabled={visibilityControlsDisabled || row.visibilityChangeLocked || visibilityUpdatingIds.has(row.id)}
          onChange={(checked) => onRowVisibilityChange(row.id, checked ? "ACTIVE" : "INACTIVE")}
        />
      ),
    },
    {
      key: "likeCount",
      headerClassName: `${headerBaseClass} lg:w-[82px]`,
      cellClassName: `${nowrapCellClass} lg:w-[82px]`,
      header: <SortHeader field="like_count" label="좋아요수" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.likeCount.toLocaleString(),
    },
    {
      key: "postStatus",
      headerClassName: `${headerBaseClass} lg:w-[92px]`,
      cellClassName: `${nowrapCellClass} lg:w-[92px]`,
      header: <SortHeader field="post_status" label="토크상태" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => (
        <StatusBadge size="sm" color={talkPostStatusBadgeColor(row.postStatus)}>
          {labelTalkPostStatus(row.postStatus)}
        </StatusBadge>
      ),
    },
  ];
}

type TalkCommentsDataTableProps = {
  rows: TalkCommentRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  sortState: TalkCommentSortState;
  selectedIds: Set<number>;
  visibilityUpdatingIds: Set<number>;
  bulkUpdating: boolean;
  onToggleSort: (field: TalkCommentSortField) => void;
  onToggleRow: (id: number, checked: boolean) => void;
  onToggleAllRows: (checked: boolean) => void;
  onBulkVisibilityChange: (status: string) => void;
  onRowVisibilityChange: (id: number, status: string) => void;
  onRefresh: () => void;
  onGoPage: (page: number) => void;
};

export function TalkCommentsDataTable({
  rows,
  meta,
  loading,
  refreshing,
  error,
  sortState,
  selectedIds,
  visibilityUpdatingIds,
  bulkUpdating,
  onToggleSort,
  onToggleRow,
  onToggleAllRows,
  onBulkVisibilityChange,
  onRowVisibilityChange,
  onRefresh,
  onGoPage,
}: TalkCommentsDataTableProps) {
  const selectedCount = selectedIds.size;
  const selectableRows = React.useMemo(
    () => rows.filter((row) => !row.visibilityChangeLocked),
    [rows],
  );
  const allPageRowsSelected = selectableRows.length > 0 && selectableRows.every((row) => selectedIds.has(row.id));
  const columns = React.useMemo(
    () => buildCommentColumns({
      sortState,
      selectedIds,
      allPageRowsSelected,
      hasSelectableRows: selectableRows.length > 0,
      visibilityUpdatingIds,
      visibilityControlsDisabled: bulkUpdating || loading || refreshing,
      onToggleSort,
      onToggleRow,
      onToggleAllRows,
      onRowVisibilityChange,
    }),
    [
      allPageRowsSelected,
      bulkUpdating,
      loading,
      onRowVisibilityChange,
      onToggleAllRows,
      onToggleRow,
      onToggleSort,
      refreshing,
      selectedIds,
      selectableRows.length,
      sortState,
      visibilityUpdatingIds,
    ],
  );

  return (
    <DataTable
      tableClassName="min-w-[1360px] w-full lg:min-w-full lg:table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      loadingVariant="spinner"
      loadingLabel="토크 댓글 목록 불러오는 중"
      loading={loading}
      refreshing={refreshing}
      error={error}
      meta={meta}
      onGoPage={onGoPage}
      onRefresh={onRefresh}
      refreshPlacement="left"
      rightActions={(
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={selectedCount === 0 || bulkUpdating || loading || refreshing}
            onClick={() => onBulkVisibilityChange("ACTIVE")}
            className="h-9 min-w-16"
          >
            노출
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={selectedCount === 0 || bulkUpdating || loading || refreshing}
            onClick={() => onBulkVisibilityChange("INACTIVE")}
            className="h-9 min-w-16"
          >
            미노출
          </Button>
        </div>
      )}
      emptyText="조건에 맞는 토크 댓글이 없습니다."
    />
  );
}
