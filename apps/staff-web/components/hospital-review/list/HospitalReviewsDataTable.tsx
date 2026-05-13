"use client";

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
  formatHospitalReviewCost,
  formatHospitalReviewRating,
  hospitalReviewPostStatusBadgeColor,
  labelHospitalReviewPostStatus,
  resolveHospitalReviewMediaUrl,
  type HospitalReviewRow,
  type HospitalReviewSortField,
  type HospitalReviewSortState,
} from "@/lib/hospital-review/list";

function renderSortMark(field: HospitalReviewSortField, sortState: HospitalReviewSortState) {
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
  field: HospitalReviewSortField;
  label: string;
  sortState: HospitalReviewSortState;
  onToggleSort: (field: HospitalReviewSortField) => void;
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

function FeatureBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
      {label}
    </span>
  );
}

function renderBestBadges(row: HospitalReviewRow) {
  if (!row.isMainFeatured && !row.isSubFeatured) {
    return "-";
  }

  return (
    <div className="flex flex-wrap gap-1">
      {row.isMainFeatured ? <FeatureBadge label="메인" /> : null}
      {row.isSubFeatured ? <FeatureBadge label="부위" /> : null}
    </div>
  );
}

function renderCategoryBadges(row: HospitalReviewRow) {
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

function renderImagePreview(row: HospitalReviewRow) {
  const imageCount = row.beforeImageCount + row.afterImageCount;
  const imageUrl = resolveHospitalReviewMediaUrl(row.firstImage);

  if (!imageUrl) {
    return (
      <div className="flex h-[100px] w-[100px] items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 dark:border-white/[0.08] dark:text-gray-500">
        {imageCount > 0 ? "1+" : "0"}
      </div>
    );
  }

  return (
    <div className="relative h-[100px] w-[100px] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.04]">
      {/* eslint-disable-next-line @next/next/no-img-element -- image domains come from runtime API/storage configuration */}
      <img
        src={imageUrl}
        alt={`후기 ${row.id} 이미지`}
        loading="lazy"
        className="h-full w-full object-cover"
      />
      {imageCount > 0 ? (
        <span className="absolute right-0 bottom-0 rounded-tl-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white">
          1+
        </span>
      ) : null}
    </div>
  );
}

function buildHospitalReviewColumns({
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
  sortState: HospitalReviewSortState;
  selectedIds: Set<number>;
  allPageRowsSelected: boolean;
  hasSelectableRows: boolean;
  visibilityUpdatingIds: Set<number>;
  visibilityControlsDisabled: boolean;
  onToggleSort: (field: HospitalReviewSortField) => void;
  onToggleRow: (row: HospitalReviewRow, checked: boolean) => void;
  onToggleAllRows: (checked: boolean) => void;
  onRowVisibilityChange: (row: HospitalReviewRow, status: "ACTIVE" | "INACTIVE") => void;
}): DataTableColumn<HospitalReviewRow>[] {
  const headerBaseClass = "px-3 py-3 text-left font-semibold text-theme-xs text-gray-600 dark:text-gray-300";
  const cellBaseClass = "px-3 py-4 text-start align-top dark:text-gray-200";
  const nowrapCellClass = `${cellBaseClass} whitespace-nowrap`;
  const imageHeaderClass = "px-2 py-3 text-left font-semibold text-theme-xs text-gray-600 dark:text-gray-300";
  const imageCellClass = "px-2 py-4 text-start align-top whitespace-nowrap dark:text-gray-200";
  const metricHeaderClass = "px-2 py-3 text-left font-semibold text-theme-xs text-gray-600 dark:text-gray-300";
  const metricCellClass = "px-2 py-4 text-center align-top whitespace-nowrap dark:text-gray-200";

  return [
    {
      key: "select",
      headerClassName: `${headerBaseClass} lg:w-[42px]`,
      cellClassName: `${nowrapCellClass} lg:w-[42px]`,
      header: (
        <SelectionCheckbox
          label="현재 페이지 후기 전체 선택"
          checked={allPageRowsSelected}
          disabled={!hasSelectableRows || visibilityControlsDisabled}
          onChange={onToggleAllRows}
        />
      ),
      render: (row) => (
        <SelectionCheckbox
          label={`후기 ${row.id} 선택`}
          checked={selectedIds.has(row.id)}
          disabled={row.visibilityChangeLocked || visibilityControlsDisabled}
          onChange={(checked) => onToggleRow(row, checked)}
        />
      ),
    },
    {
      key: "createdAt",
      headerClassName: `${headerBaseClass} lg:w-[88px]`,
      cellClassName: `${nowrapCellClass} lg:w-[88px]`,
      header: <SortHeader field="created_at" label="작성일" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.createdAt,
    },
    {
      key: "category",
      headerClassName: `${headerBaseClass} lg:w-[190px]`,
      cellClassName: `${cellBaseClass} lg:w-[190px]`,
      header: "카테고리",
      render: renderCategoryBadges,
    },
    {
      key: "images",
      headerClassName: `${imageHeaderClass} lg:w-[116px]`,
      cellClassName: `${imageCellClass} lg:w-[116px]`,
      header: "이미지",
      render: renderImagePreview,
    },
    {
      key: "author",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${cellBaseClass} lg:w-[120px]`,
      header: "닉네임",
      render: (row) => (
        <span className="block line-clamp-2 break-words" title={row.authorName}>
          {row.authorName}
        </span>
      ),
    },
    {
      key: "hospital",
      headerClassName: `${headerBaseClass} lg:w-[180px]`,
      cellClassName: `${cellBaseClass} lg:w-[180px]`,
      header: "병의원명",
      render: (row) => (
        <span className="block line-clamp-2 font-medium text-gray-800 dark:text-white/90" title={row.hospitalName}>
          {row.hospitalName}
        </span>
      ),
    },
    {
      key: "cost",
      headerClassName: `${headerBaseClass} lg:w-[100px]`,
      cellClassName: `${nowrapCellClass} lg:w-[100px]`,
      header: <SortHeader field="cost" label="시/수술비용" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => formatHospitalReviewCost(row.cost),
    },
    {
      key: "rating",
      headerClassName: `${headerBaseClass} lg:w-[50px]`,
      cellClassName: `${nowrapCellClass} lg:w-[50px]`,
      header: <SortHeader field="rating" label="평점" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => formatHospitalReviewRating(row.rating),
    },
    {
      key: "status",
      headerClassName: `${headerBaseClass} lg:w-[72px]`,
      cellClassName: `${nowrapCellClass} lg:w-[72px]`,
      header: <SortHeader field="status" label="노출여부" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => (
        <span onClick={(event) => event.stopPropagation()}>
          <Switch
            checked={row.isVisible}
            disabled={row.visibilityChangeLocked || visibilityControlsDisabled || visibilityUpdatingIds.has(row.id)}
            ariaLabel={`후기 ${row.id} 노출 상태 변경`}
            color="gray"
            onChange={(checked) => onRowVisibilityChange(row, checked ? "ACTIVE" : "INACTIVE")}
          />
        </span>
      ),
    },
    {
      key: "featured",
      headerClassName: `${headerBaseClass} lg:w-[76px]`,
      cellClassName: `${cellBaseClass} lg:w-[76px]`,
      header: "베스트",
      render: renderBestBadges,
    },
    {
      key: "likeCount",
      headerClassName: `${metricHeaderClass} lg:w-[94px]`,
      cellClassName: `${metricCellClass} lg:w-[94px]`,
      header: <SortHeader field="like_count" label="좋아요 수" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.likeCount.toLocaleString(),
    },
    {
      key: "saveCount",
      headerClassName: `${metricHeaderClass} lg:w-[94px]`,
      cellClassName: `${metricCellClass} lg:w-[94px]`,
      header: <SortHeader field="save_count" label="저장횟수" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.saveCount.toLocaleString(),
    },
    {
      key: "commentCount",
      headerClassName: `${metricHeaderClass} lg:w-[82px]`,
      cellClassName: `${metricCellClass} lg:w-[82px]`,
      header: <SortHeader field="comment_count" label="댓글수" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.commentCount.toLocaleString(),
    },
    {
      key: "viewCount",
      headerClassName: `${metricHeaderClass} lg:w-[82px]`,
      cellClassName: `${metricCellClass} lg:w-[82px]`,
      header: <SortHeader field="view_count" label="조회수" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.viewCount.toLocaleString(),
    },
    {
      key: "postStatus",
      headerClassName: `${headerBaseClass} lg:w-[78px]`,
      cellClassName: `${nowrapCellClass} lg:w-[78px]`,
      header: <SortHeader field="post_status" label="상태" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => (
        <StatusBadge size="sm" color={hospitalReviewPostStatusBadgeColor(row.postStatus)}>
          {labelHospitalReviewPostStatus(row.postStatus)}
        </StatusBadge>
      ),
    },
  ];
}

type HospitalReviewsDataTableProps = {
  rows: HospitalReviewRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  sortState: HospitalReviewSortState;
  selectedIds: Set<number>;
  visibilityUpdatingIds: Set<number>;
  bulkUpdating: boolean;
  onToggleSort: (field: HospitalReviewSortField) => void;
  onRefresh: () => void;
  onGoPage: (page: number) => void;
  onToggleRow: (row: HospitalReviewRow, checked: boolean) => void;
  onToggleAllRows: (checked: boolean) => void;
  onBulkVisibilityChange: (status: "ACTIVE" | "INACTIVE") => void;
  onRowVisibilityChange: (row: HospitalReviewRow, status: "ACTIVE" | "INACTIVE") => void;
};

export function HospitalReviewsDataTable({
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
}: HospitalReviewsDataTableProps) {
  const selectedCount = selectedIds.size;
  const selectableRows = React.useMemo(
    () => rows.filter((row) => !row.visibilityChangeLocked),
    [rows],
  );
  const allPageRowsSelected = selectableRows.length > 0 && selectableRows.every((row) => selectedIds.has(row.id));
  const columns = React.useMemo(
    () => buildHospitalReviewColumns({
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
      tableClassName="min-w-[1460px] w-full 2xl:min-w-full lg:table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      loadingVariant="spinner"
      loadingLabel="후기 목록 불러오는 중"
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
      emptyText="조건에 맞는 후기가 없습니다."
    />
  );
}
