"use client";

import React from "react";
import {
  Button,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  DataTable,
  FormCheckbox,
  Switch,
  type DataTableColumn,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import {
  type HospitalReviewCommentRow,
  type HospitalReviewCommentSortField,
  type HospitalReviewCommentSortState,
} from "@/lib/hospital-review/comment-list";
import {
  resolveHospitalReviewMediaUrl,
} from "@/lib/hospital-review/list";

function renderSortMark(field: HospitalReviewCommentSortField, sortState: HospitalReviewCommentSortState) {
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
  field: HospitalReviewCommentSortField;
  label: string;
  sortState: HospitalReviewCommentSortState;
  onToggleSort: (field: HospitalReviewCommentSortField) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onToggleSort(field)}
      className="inline-flex min-w-0 items-center gap-1 px-0 text-xs leading-tight whitespace-normal"
    >
      <span className="min-w-0 break-keep">{label}</span>
      <span className="shrink-0 text-xs text-gray-400">{renderSortMark(field, sortState)}</span>
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
    <span onClick={(event) => event.stopPropagation()}>
      <FormCheckbox
        ariaLabel={label}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="size-4"
      />
    </span>
  );
}

function renderCategoryBadges(row: HospitalReviewCommentRow) {
  const categories = row.categoryName.split("\n").filter((categoryName) => categoryName.trim() && categoryName !== "-");

  if (categories.length === 0) {
    return "-";
  }

  return (
    <div className="flex flex-wrap gap-1.5" title={row.categoryName}>
      {categories.map((categoryName) => (
        <span
          key={categoryName}
          className="inline-flex max-w-full items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200 dark:bg-white/[0.06] dark:text-gray-200 dark:ring-white/[0.08]"
        >
          <span className="line-clamp-1 break-all">{categoryName}</span>
        </span>
      ))}
    </div>
  );
}

function renderParentImage(row: HospitalReviewCommentRow) {
  const imageUrl = resolveHospitalReviewMediaUrl(row.firstImage);
  const imageFrameClass = "h-[100px] w-full min-w-[84px] max-w-[100px] shrink-0";

  if (!imageUrl) {
    return (
      <div className={`${imageFrameClass} flex items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 dark:border-white/[0.08] dark:text-gray-500`}>
        {row.imageCount > 0 ? `${row.imageCount}+` : "0"}
      </div>
    );
  }

  return (
    <div className={`${imageFrameClass} relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.04]`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- image domains come from runtime API/storage configuration */}
      <img
        src={imageUrl}
        alt={`후기 ${row.parentReviewId ?? row.id} 이미지`}
        loading="lazy"
        className="h-full w-full object-cover"
      />
      {row.imageCount > 0 ? (
        <span className="absolute right-0 bottom-0 rounded-tl-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white">
          {row.imageCount}+
        </span>
      ) : null}
    </div>
  );
}

function ReportStatusBadge({ label, status }: { label: string; status: string }) {
  if (!label) return <span className="text-sm text-gray-400">-</span>;
  const toneClassNames: Record<string, string> = {
    AUTO_BLOCKED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    ADMIN_HIDDEN: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300",
    NORMAL_VISIBLE: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
    REEXPOSED: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  };
  const toneClassName = toneClassNames[status] ?? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${toneClassName}`}>
      {label}
    </span>
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
  sortState: HospitalReviewCommentSortState;
  selectedIds: Set<number>;
  allPageRowsSelected: boolean;
  hasSelectableRows: boolean;
  visibilityUpdatingIds: Set<number>;
  visibilityControlsDisabled: boolean;
  onToggleSort: (field: HospitalReviewCommentSortField) => void;
  onToggleRow: (row: HospitalReviewCommentRow, checked: boolean) => void;
  onToggleAllRows: (checked: boolean) => void;
  onRowVisibilityChange: (row: HospitalReviewCommentRow, status: "ACTIVE" | "INACTIVE") => void;
}): DataTableColumn<HospitalReviewCommentRow>[] {
  const headerBaseClass = "px-2 py-3 text-left font-semibold text-theme-xs text-gray-600 dark:text-gray-300";
  const cellBaseClass = "px-2 py-4 text-start align-top dark:text-gray-200";
  const nowrapCellClass = `${cellBaseClass} whitespace-nowrap`;
  const imageHeaderClass = "px-2 py-3 text-left font-semibold text-theme-xs text-gray-600 dark:text-gray-300";
  const imageCellClass = "px-2 py-4 text-start align-top dark:text-gray-200";
  const twoLineClampStyle: React.CSSProperties = {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

  return [
    {
      key: "select",
      headerClassName: `${headerBaseClass} lg:w-[42px] xl:w-[4%]`,
      cellClassName: `${nowrapCellClass} lg:w-[42px] xl:w-[4%]`,
      header: (
        <SelectionCheckbox
          label="현재 페이지 후기 댓글 전체 선택"
          checked={allPageRowsSelected}
          disabled={!hasSelectableRows || visibilityControlsDisabled}
          onChange={onToggleAllRows}
        />
      ),
      render: (row) => (
        <SelectionCheckbox
          label={`후기 댓글 ${row.id} 선택`}
          checked={selectedIds.has(row.id)}
          disabled={row.visibilityChangeLocked || visibilityControlsDisabled}
          onChange={(checked) => onToggleRow(row, checked)}
        />
      ),
    },
    {
      key: "id",
      headerClassName: `${headerBaseClass} lg:w-[76px] xl:w-[7%]`,
      cellClassName: `${nowrapCellClass} lg:w-[76px] xl:w-[7%]`,
      header: <SortHeader field="id" label="댓글ID" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.id,
    },
    {
      key: "createdAt",
      headerClassName: `${headerBaseClass} lg:w-[132px] xl:w-[10%]`,
      cellClassName: `${nowrapCellClass} lg:w-[132px] xl:w-[10%]`,
      header: <SortHeader field="created_at" label="댓글작성일" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.createdAt,
    },
    {
      key: "category",
      headerClassName: `${headerBaseClass} lg:w-[184px] xl:w-[16%]`,
      cellClassName: `${cellBaseClass} lg:w-[184px] xl:w-[16%]`,
      header: "카테고리",
      render: renderCategoryBadges,
    },
    {
      key: "author",
      headerClassName: `${headerBaseClass} lg:w-[120px] xl:w-[10%]`,
      cellClassName: `${cellBaseClass} lg:w-[120px] xl:w-[10%]`,
      header: "댓글작성자",
      render: (row) => (
        <span className="block line-clamp-2 break-words text-sm text-gray-700 dark:text-gray-200" title={row.authorName}>
          {row.authorName}
        </span>
      ),
    },
    {
      key: "content",
      headerClassName: `${headerBaseClass} lg:w-[260px] xl:w-[23%]`,
      cellClassName: `${cellBaseClass} lg:w-[260px] xl:w-[23%]`,
      header: "댓글내용",
      render: (row) => (
        <div className="whitespace-normal break-words text-sm leading-6 text-gray-600 dark:text-gray-300" style={twoLineClampStyle}>
          {row.contentPreview}
        </div>
      ),
    },
    {
      key: "parentImage",
      headerClassName: `${imageHeaderClass} lg:w-[116px] xl:w-[10%]`,
      cellClassName: `${imageCellClass} lg:w-[116px] xl:w-[10%]`,
      header: "게시글 이미지",
      render: renderParentImage,
    },
    {
      key: "status",
      headerClassName: `${headerBaseClass} lg:w-[82px] xl:w-[7%]`,
      cellClassName: `${nowrapCellClass} lg:w-[82px] xl:w-[7%]`,
      header: <SortHeader field="status" label="노출여부" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => (
        <span onClick={(event) => event.stopPropagation()}>
          <Switch
            checked={row.isVisible}
            disabled={row.visibilityChangeLocked || visibilityControlsDisabled || visibilityUpdatingIds.has(row.id)}
            ariaLabel={`후기 댓글 ${row.id} 노출 상태 변경`}
            color="gray"
            onChange={(checked) => onRowVisibilityChange(row, checked ? "ACTIVE" : "INACTIVE")}
          />
        </span>
      ),
    },
    {
      key: "likeCount",
      headerClassName: `${headerBaseClass} lg:w-[84px] xl:w-[6%]`,
      cellClassName: `${nowrapCellClass} lg:w-[84px] xl:w-[6%]`,
      header: <SortHeader field="like_count" label="좋아요수" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.likeCount.toLocaleString(),
    },
    {
      key: "reportStatus",
      headerClassName: `${headerBaseClass} lg:w-[88px] xl:w-[7%]`,
      cellClassName: `${nowrapCellClass} lg:w-[88px] xl:w-[7%]`,
      header: "상태",
      render: (row) => <ReportStatusBadge label={row.reportStatusLabel} status={row.reportStatus} />,
    },
  ];
}

type HospitalReviewCommentsDataTableProps = {
  rows: HospitalReviewCommentRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  sortState: HospitalReviewCommentSortState;
  selectedIds: Set<number>;
  visibilityUpdatingIds: Set<number>;
  bulkUpdating: boolean;
  onToggleSort: (field: HospitalReviewCommentSortField) => void;
  onRefresh: () => void;
  onGoPage: (page: number) => void;
  onToggleRow: (row: HospitalReviewCommentRow, checked: boolean) => void;
  onToggleAllRows: (checked: boolean) => void;
  onBulkVisibilityChange: (status: "ACTIVE" | "INACTIVE") => void;
  onRowVisibilityChange: (row: HospitalReviewCommentRow, status: "ACTIVE" | "INACTIVE") => void;
};

export function HospitalReviewCommentsDataTable({
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
  onRefresh,
  onGoPage,
  onToggleRow,
  onToggleAllRows,
  onBulkVisibilityChange,
  onRowVisibilityChange,
}: HospitalReviewCommentsDataTableProps) {
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
      tableClassName="min-w-[1040px] w-full lg:min-w-full lg:table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      loadingVariant="spinner"
      loadingLabel="후기 댓글 목록 불러오는 중"
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
      emptyText="조건에 맞는 후기 댓글이 없습니다."
    />
  );
}
