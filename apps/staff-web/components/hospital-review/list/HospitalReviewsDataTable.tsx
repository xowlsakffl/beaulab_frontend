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
  formatHospitalReviewCost,
  formatHospitalReviewRating,
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
  align = "left",
}: {
  field: HospitalReviewSortField;
  label: string;
  sortState: HospitalReviewSortState;
  onToggleSort: (field: HospitalReviewSortField) => void;
  align?: "left" | "center";
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onToggleSort(field)}
      className={`inline-flex min-w-0 items-center gap-1 px-0 text-xs leading-tight whitespace-normal ${
        align === "center" ? "justify-center text-center" : ""
      }`}
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

function FeatureBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
      {label}
    </span>
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
  const imageFrameClass = "h-[100px] w-full min-w-[84px] max-w-[100px] shrink-0";

  if (!imageUrl) {
    return (
      <div className={`${imageFrameClass} flex items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 dark:border-white/[0.08] dark:text-gray-500`}>
        {imageCount > 0 ? `${imageCount}+` : "0"}
      </div>
    );
  }

  return (
    <div className={`${imageFrameClass} relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.04]`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- image domains come from runtime API/storage configuration */}
      <img
        src={imageUrl}
        alt={`후기 ${row.id} 이미지`}
        loading="lazy"
        className="h-full w-full object-cover"
      />
      {imageCount > 0 ? (
        <span className="absolute right-0 bottom-0 rounded-tl-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white">
          {imageCount}+
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
  const headerBaseClass = "px-1.5 py-3 text-left font-semibold text-theme-xs text-gray-600 dark:text-gray-300";
  const cellBaseClass = "px-1.5 py-4 text-start align-top dark:text-gray-200";
  const nowrapCellClass = `${cellBaseClass} whitespace-nowrap`;
  const imageHeaderClass = "px-1.5 py-3 text-left font-semibold text-theme-xs text-gray-600 dark:text-gray-300";
  const imageCellClass = "px-1.5 py-4 text-start align-top dark:text-gray-200";
  const metricHeaderClass = "px-1.5 py-3 text-center font-semibold text-theme-xs text-gray-600 dark:text-gray-300";
  const metricCellClass = "px-1.5 py-4 text-center align-top whitespace-nowrap dark:text-gray-200";

  return [
    {
      key: "select",
      headerClassName: `${headerBaseClass} lg:w-[34px] xl:w-[3%]`,
      cellClassName: `${nowrapCellClass} lg:w-[34px] xl:w-[3%]`,
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
      key: "id",
      headerClassName: `${headerBaseClass} lg:w-[44px] xl:w-[3.5%]`,
      cellClassName: `${nowrapCellClass} lg:w-[44px] xl:w-[3.5%]`,
      header: <SortHeader field="id" label="ID" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.id,
    },
    {
      key: "createdAt",
      headerClassName: `${headerBaseClass} lg:w-[82px] xl:w-[6.5%]`,
      cellClassName: `${nowrapCellClass} lg:w-[82px] xl:w-[6.5%]`,
      header: <SortHeader field="created_at" label="작성일" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.createdAt,
    },
    {
      key: "category",
      headerClassName: `${headerBaseClass} lg:w-[142px] xl:w-[10.5%]`,
      cellClassName: `${cellBaseClass} lg:w-[142px] xl:w-[10.5%]`,
      header: "카테고리",
      render: renderCategoryBadges,
    },
    {
      key: "images",
      headerClassName: `${imageHeaderClass} lg:w-[108px] xl:w-[9%]`,
      cellClassName: `${imageCellClass} lg:w-[108px] xl:w-[9%]`,
      header: "이미지",
      render: renderImagePreview,
    },
    {
      key: "author",
      headerClassName: `${headerBaseClass} lg:w-[112px] xl:w-[8.5%]`,
      cellClassName: `${cellBaseClass} lg:w-[112px] xl:w-[8.5%]`,
      header: "닉네임",
      render: (row) => (
        <span className="block line-clamp-2 break-words" title={row.authorName}>
          {row.authorName}
        </span>
      ),
    },
    {
      key: "hospital",
      headerClassName: `${headerBaseClass} lg:w-[142px] xl:w-[11%]`,
      cellClassName: `${cellBaseClass} lg:w-[142px] xl:w-[11%]`,
      header: "병의원명",
      render: (row) => (
        <span className="block line-clamp-2 font-medium text-gray-800 dark:text-white/90" title={row.hospitalName}>
          {row.hospitalName}
        </span>
      ),
    },
    {
      key: "cost",
      headerClassName: `${headerBaseClass} lg:w-[88px] xl:w-[7%]`,
      cellClassName: `${nowrapCellClass} lg:w-[88px] xl:w-[7%]`,
      header: <SortHeader field="cost" label="시/수술비용" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => formatHospitalReviewCost(row.cost),
    },
    {
      key: "rating",
      headerClassName: `${headerBaseClass} lg:w-[42px] xl:w-[3.8%]`,
      cellClassName: `${nowrapCellClass} lg:w-[42px] xl:w-[3.8%]`,
      header: <SortHeader field="rating" label="평점" sortState={sortState} onToggleSort={onToggleSort} align="center" />,
      render: (row) => formatHospitalReviewRating(row.rating),
    },
    {
      key: "status",
      headerClassName: `${headerBaseClass} lg:w-[62px] xl:w-[5%]`,
      cellClassName: `${nowrapCellClass} lg:w-[62px] xl:w-[5%]`,
      header: <SortHeader field="status" label="노출여부" sortState={sortState} onToggleSort={onToggleSort} align="center" />,
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
      headerClassName: `${headerBaseClass} lg:w-[58px] xl:w-[4.5%]`,
      cellClassName: `${cellBaseClass} lg:w-[58px] xl:w-[4.5%]`,
      header: "베스트",
      render: renderBestBadges,
    },
    {
      key: "likeCount",
      headerClassName: `${metricHeaderClass} lg:w-[78px] xl:w-[5.5%]`,
      cellClassName: `${metricCellClass} lg:w-[78px] xl:w-[5.5%]`,
      header: <SortHeader field="like_count" label="좋아요수" sortState={sortState} onToggleSort={onToggleSort} align="center" />,
      render: (row) => row.likeCount.toLocaleString(),
    },
    {
      key: "saveCount",
      headerClassName: `${metricHeaderClass} lg:w-[68px] xl:w-[4.8%]`,
      cellClassName: `${metricCellClass} lg:w-[68px] xl:w-[4.8%]`,
      header: <SortHeader field="save_count" label="저장횟수" sortState={sortState} onToggleSort={onToggleSort} align="center" />,
      render: (row) => row.saveCount.toLocaleString(),
    },
    {
      key: "commentCount",
      headerClassName: `${metricHeaderClass} lg:w-[58px] xl:w-[4%]`,
      cellClassName: `${metricCellClass} lg:w-[58px] xl:w-[4%]`,
      header: <SortHeader field="comment_count" label="댓글수" sortState={sortState} onToggleSort={onToggleSort} align="center" />,
      render: (row) => row.commentCount.toLocaleString(),
    },
    {
      key: "viewCount",
      headerClassName: `${metricHeaderClass} lg:w-[58px] xl:w-[4%]`,
      cellClassName: `${metricCellClass} lg:w-[58px] xl:w-[4%]`,
      header: <SortHeader field="view_count" label="조회수" sortState={sortState} onToggleSort={onToggleSort} align="center" />,
      render: (row) => row.viewCount.toLocaleString(),
    },
    {
      key: "reportStatus",
      headerClassName: `${headerBaseClass} lg:w-[82px] xl:w-[6%]`,
      cellClassName: `${nowrapCellClass} lg:w-[82px] xl:w-[6%]`,
      header: "상태",
      render: (row) => <ReportStatusBadge label={row.reportStatusLabel} status={row.reportStatus} />,
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
  onOpenDetail: (row: HospitalReviewRow) => void;
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
  onOpenDetail,
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
      tableClassName="min-w-[1140px] w-full lg:min-w-full lg:table-fixed"
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
      onRowClick={onOpenDetail}
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
