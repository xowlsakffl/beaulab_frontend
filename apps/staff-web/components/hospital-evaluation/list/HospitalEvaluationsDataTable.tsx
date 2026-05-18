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
  formatHospitalEvaluationCost,
  formatHospitalEvaluationRating,
  type HospitalEvaluationRow,
  type HospitalEvaluationSortField,
  type HospitalEvaluationSortState,
} from "@/lib/hospital-evaluation/list";

function renderSortMark(field: HospitalEvaluationSortField, sortState: HospitalEvaluationSortState) {
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
  field: HospitalEvaluationSortField;
  label: string;
  sortState: HospitalEvaluationSortState;
  onToggleSort: (field: HospitalEvaluationSortField) => void;
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

function renderReceipt(row: HospitalEvaluationRow) {
  if (row.receiptLabel === "-") {
    return <span className="text-sm text-gray-400">-</span>;
  }

  return (
    <span className="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-200">
      {row.receiptLabel}
    </span>
  );
}

function ReportStatusBadge({ label, status }: { label: string; status: string }) {
  if (!label) return <span className="text-sm text-gray-400">-</span>;
  const toneClassName = status === "ADMIN_HIDDEN"
    ? "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300"
    : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${toneClassName}`}>
      {label}
    </span>
  );
}

function buildHospitalEvaluationColumns({
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
  sortState: HospitalEvaluationSortState;
  selectedIds: Set<number>;
  allPageRowsSelected: boolean;
  hasSelectableRows: boolean;
  visibilityUpdatingIds: Set<number>;
  visibilityControlsDisabled: boolean;
  onToggleSort: (field: HospitalEvaluationSortField) => void;
  onToggleRow: (row: HospitalEvaluationRow, checked: boolean) => void;
  onToggleAllRows: (checked: boolean) => void;
  onRowVisibilityChange: (row: HospitalEvaluationRow, status: "ACTIVE" | "INACTIVE") => void;
}): DataTableColumn<HospitalEvaluationRow>[] {
  const headerBaseClass = "px-1.5 py-3 text-left font-semibold text-theme-xs text-gray-600 dark:text-gray-300";
  const cellBaseClass = "px-1.5 py-4 text-start align-top dark:text-gray-200";
  const nowrapCellClass = `${cellBaseClass} whitespace-nowrap`;
  const metricHeaderClass = "px-1.5 py-3 text-center font-semibold text-theme-xs text-gray-600 dark:text-gray-300";
  const metricCellClass = "px-1.5 py-4 text-center align-top whitespace-nowrap dark:text-gray-200";

  return [
    {
      key: "select",
      headerClassName: `${headerBaseClass} lg:w-[34px] xl:w-[3%]`,
      cellClassName: `${nowrapCellClass} lg:w-[34px] xl:w-[3%]`,
      header: (
        <SelectionCheckbox
          label="현재 페이지 평가 전체 선택"
          checked={allPageRowsSelected}
          disabled={!hasSelectableRows || visibilityControlsDisabled}
          onChange={onToggleAllRows}
        />
      ),
      render: (row) => (
        <SelectionCheckbox
          label={`평가 ${row.id} 선택`}
          checked={selectedIds.has(row.id)}
          disabled={row.visibilityChangeLocked || visibilityControlsDisabled}
          onChange={(checked) => onToggleRow(row, checked)}
        />
      ),
    },
    {
      key: "id",
      headerClassName: `${headerBaseClass} lg:w-[58px] xl:w-[5%]`,
      cellClassName: `${nowrapCellClass} lg:w-[58px] xl:w-[5%]`,
      header: <SortHeader field="id" label="평가ID" sortState={sortState} onToggleSort={onToggleSort} />,
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
      key: "reviewType",
      headerClassName: `${headerBaseClass} lg:w-[78px] xl:w-[6.5%]`,
      cellClassName: `${nowrapCellClass} lg:w-[78px] xl:w-[6.5%]`,
      header: "후기유형",
      render: (row) => row.reviewType,
    },
    {
      key: "hospital",
      headerClassName: `${headerBaseClass} lg:w-[130px] xl:w-[10.5%]`,
      cellClassName: `${cellBaseClass} lg:w-[130px] xl:w-[10.5%]`,
      header: "병의원명",
      render: (row) => (
        <span className="block line-clamp-2 font-medium text-gray-800 dark:text-white/90" title={row.hospitalName}>
          {row.hospitalName}
        </span>
      ),
    },
    {
      key: "doctor",
      headerClassName: `${headerBaseClass} lg:w-[92px] xl:w-[7.5%]`,
      cellClassName: `${cellBaseClass} lg:w-[92px] xl:w-[7.5%]`,
      header: "의료진명",
      render: (row) => (
        <span className="block line-clamp-2 break-words" title={row.doctorName}>
          {row.doctorName}
        </span>
      ),
    },
    {
      key: "author",
      headerClassName: `${headerBaseClass} lg:w-[92px] xl:w-[7.5%]`,
      cellClassName: `${cellBaseClass} lg:w-[92px] xl:w-[7.5%]`,
      header: "닉네임",
      render: (row) => (
        <span className="block line-clamp-2 break-words" title={row.authorName}>
          {row.authorName}
        </span>
      ),
    },
    {
      key: "phone",
      headerClassName: `${headerBaseClass} lg:w-[112px] xl:w-[8.5%]`,
      cellClassName: `${nowrapCellClass} lg:w-[112px] xl:w-[8.5%]`,
      header: "전화번호",
      render: (row) => row.phone,
    },
    {
      key: "cost",
      headerClassName: `${headerBaseClass} lg:w-[92px] xl:w-[7%]`,
      cellClassName: `${nowrapCellClass} lg:w-[92px] xl:w-[7%]`,
      header: <SortHeader field="cost" label="시/수술비용" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => formatHospitalEvaluationCost(row.cost),
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
            ariaLabel={`평가 ${row.id} 노출 상태 변경`}
            color="gray"
            onChange={(checked) => onRowVisibilityChange(row, checked ? "ACTIVE" : "INACTIVE")}
          />
        </span>
      ),
    },
    {
      key: "averageRating",
      headerClassName: `${metricHeaderClass} lg:w-[54px] xl:w-[4.5%]`,
      cellClassName: `${metricCellClass} lg:w-[54px] xl:w-[4.5%]`,
      header: <SortHeader field="average_rating" label="평점" sortState={sortState} onToggleSort={onToggleSort} align="center" />,
      render: (row) => formatHospitalEvaluationRating(row.averageRating),
    },
    {
      key: "viewCount",
      headerClassName: `${metricHeaderClass} lg:w-[62px] xl:w-[5%]`,
      cellClassName: `${metricCellClass} lg:w-[62px] xl:w-[5%]`,
      header: <SortHeader field="view_count" label="조회수" sortState={sortState} onToggleSort={onToggleSort} align="center" />,
      render: (row) => row.viewCount.toLocaleString(),
    },
    {
      key: "receipt",
      headerClassName: `${headerBaseClass} lg:w-[86px] xl:w-[7%]`,
      cellClassName: `${cellBaseClass} lg:w-[86px] xl:w-[7%]`,
      header: <SortHeader field="receipt_status" label="영수증인증" sortState={sortState} onToggleSort={onToggleSort} />,
      render: renderReceipt,
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

type HospitalEvaluationsDataTableProps = {
  rows: HospitalEvaluationRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  sortState: HospitalEvaluationSortState;
  selectedIds: Set<number>;
  visibilityUpdatingIds: Set<number>;
  bulkUpdating: boolean;
  onToggleSort: (field: HospitalEvaluationSortField) => void;
  onRefresh: () => void;
  onGoPage: (page: number) => void;
  onToggleRow: (row: HospitalEvaluationRow, checked: boolean) => void;
  onToggleAllRows: (checked: boolean) => void;
  onBulkVisibilityChange: (status: "ACTIVE" | "INACTIVE") => void;
  onRowVisibilityChange: (row: HospitalEvaluationRow, status: "ACTIVE" | "INACTIVE") => void;
  onOpenDetail: (row: HospitalEvaluationRow) => void;
};

export function HospitalEvaluationsDataTable({
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
}: HospitalEvaluationsDataTableProps) {
  const selectedCount = selectedIds.size;
  const selectableRows = React.useMemo(
    () => rows.filter((row) => !row.visibilityChangeLocked),
    [rows],
  );
  const allPageRowsSelected = selectableRows.length > 0 && selectableRows.every((row) => selectedIds.has(row.id));
  const columns = React.useMemo(
    () => buildHospitalEvaluationColumns({
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
      tableClassName="min-w-[1180px] w-full lg:min-w-full lg:table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      loadingVariant="spinner"
      loadingLabel="평가 목록 불러오는 중"
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
      emptyText="조건에 맞는 평가가 없습니다."
    />
  );
}
