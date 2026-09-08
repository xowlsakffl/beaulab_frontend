import React from "react";

import {
  DataTable,
  DataTableSortHeader,
  type DataTableColumn,
  type DataTableMeta,
  StatusValueBadge,
} from "@beaulab/ui-admin";

import {
  hospitalStatusBadgeColor,
  labelApprovalStatus,
  labelReviewStatus,
  type HospitalRow,
  type SortField,
  type SortState,
} from "@/lib/hospital/list";
import { pendingReviewAllowStatusRowClass, reviewAllowStatusColor } from "@/lib/common/review-status";

function buildHospitalColumns({
  sortState,
  onToggleSort,
}: {
  sortState: SortState;
  onToggleSort: (field: SortField) => void;
}): DataTableColumn<HospitalRow>[] {
  const headerBaseClass = "px-2 py-3 text-left font-semibold text-theme-xs text-gray-600 ";
  const cellBaseClass = "px-2 py-4 text-start align-top ";
  const nowrapCellClass = `${cellBaseClass} overflow-hidden text-ellipsis whitespace-nowrap`;
  const spacedHeaderClass = headerBaseClass;
  const spacedNowrapCellClass = nowrapCellClass;

  return [
    {
      key: "id",
      headerClassName: `${headerBaseClass} lg:w-[52px]`,
      cellClassName: `${nowrapCellClass} lg:w-[52px]`,
      header: (
        <DataTableSortHeader
          label="UID"
          active={sortState.enabled && sortState.field === "id"}
          direction={sortState.direction}
          onClick={() => onToggleSort("id")}
        />
      ),
      render: (row) => row.id,
    },
    {
      key: "department",
      headerClassName: `${spacedHeaderClass} lg:w-[72px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[72px]`,
      header: "분과",
      render: (row) => row.departmentLabel,
    },
    {
      key: "name",
      headerClassName: `${headerBaseClass} lg:w-[220px]`,
      cellClassName: `${cellBaseClass} lg:w-[220px]`,
      header: (
        <DataTableSortHeader
          label="병의원"
          active={sortState.enabled && sortState.field === "name"}
          direction={sortState.direction}
          onClick={() => onToggleSort("name")}
        />
      ),
      render: (row) => (
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-400">
            {row.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
              <img
                src={row.logoUrl}
                alt={`${row.name} 로고`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              "로고"
            )}
          </div>
          <span className="line-clamp-2 block min-w-0 flex-1 font-medium break-words text-gray-800" title={row.name}>
            {row.name}
          </span>
        </div>
      ),
    },
    {
      key: "loginId",
      headerClassName: `${spacedHeaderClass} lg:w-[100px]`,
      cellClassName: `${cellBaseClass} lg:w-[100px]`,
      header: "아이디",
      render: (row) => (
        <span className="line-clamp-2 block break-all text-gray-700" title={row.loginId}>
          {row.loginId}
        </span>
      ),
    },
    {
      key: "tel",
      headerClassName: `${spacedHeaderClass} lg:w-[100px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[100px]`,
      header: "연락처",
      render: (row) => row.tel || "-",
    },
    {
      key: "eventCount",
      headerClassName: `${spacedHeaderClass} lg:w-[50px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[50px]`,
      header: "이벤트",
      render: (row) => row.eventCount.toLocaleString(),
    },
    {
      key: "consultationCount",
      headerClassName: `${spacedHeaderClass} lg:w-[60px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[60px]`,
      header: "상담신청",
      render: (row) => row.consultationCount.toLocaleString(),
    },
    {
      key: "evaluation",
      headerClassName: `${spacedHeaderClass} lg:w-[82px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[82px]`,
      header: (
        <DataTableSortHeader
          label="병의원평가"
          active={sortState.enabled && sortState.field === "evaluation_count"}
          direction={sortState.direction}
          onClick={() => onToggleSort("evaluation_count")}
        />
      ),
      render: (row) => `${row.evaluationCount.toLocaleString()}(${row.evaluationAverageRating.toFixed(1)})`,
    },
    {
      key: "reviews",
      headerClassName: `${spacedHeaderClass} lg:w-[84px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[84px]`,
      header: "성형/시술후기",
      render: (row) => `${row.surgeryReviewCount.toLocaleString()}/${row.treatmentReviewCount.toLocaleString()}`,
    },
    {
      key: "viewCount",
      headerClassName: `${spacedHeaderClass} lg:w-[60px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[60px]`,
      header: (
        <DataTableSortHeader
          label="조회수"
          active={sortState.enabled && sortState.field === "view_count"}
          direction={sortState.direction}
          onClick={() => onToggleSort("view_count")}
        />
      ),
      render: (row) => row.viewCount.toLocaleString(),
    },
    {
      key: "hospitalStatus",
      headerClassName: `${spacedHeaderClass} lg:w-[76px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[76px]`,
      header: (
        <DataTableSortHeader
          label="병의원상태"
          active={sortState.enabled && sortState.field === "status"}
          direction={sortState.direction}
          onClick={() => onToggleSort("status")}
        />
      ),
      render: (row) => (
        <StatusValueBadge
          label={labelApprovalStatus(row.hospitalStatus)}
          color={hospitalStatusBadgeColor(row.hospitalStatus)}
        />
      ),
    },
    {
      key: "reviewStatus",
      headerClassName: `${spacedHeaderClass} lg:w-[68px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[68px]`,
      header: (
        <DataTableSortHeader
          label="검수상태"
          active={sortState.enabled && sortState.field === "allow_status"}
          direction={sortState.direction}
          onClick={() => onToggleSort("allow_status")}
        />
      ),
      render: (row) => (
        <StatusValueBadge
          label={labelReviewStatus(row.reviewStatus)}
          color={reviewAllowStatusColor(row.reviewStatus)}
        />
      ),
    },
    {
      key: "lastLoginAt",
      headerClassName: `${spacedHeaderClass} lg:w-[110px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[110px]`,
      header: (
        <DataTableSortHeader
          label="최근접속일"
          active={sortState.enabled && sortState.field === "last_login_at"}
          direction={sortState.direction}
          onClick={() => onToggleSort("last_login_at")}
        />
      ),
      render: (row) => (
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <span>{row.lastLoginAt}</span>
          {row.isDormant ? <StatusValueBadge label="휴면" color="gray" /> : null}
        </div>
      ),
    },
  ];
}

type HospitalsDataTableProps = {
  rows: HospitalRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  highlightedRowId: number | null;
  sortState: SortState;
  onToggleSort: (field: SortField) => void;
  onGoPage: (page: number) => void;
  onRowClick: (row: HospitalRow) => void;
};

export function HospitalsDataTable({
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
}: HospitalsDataTableProps) {
  const columns = React.useMemo(() => buildHospitalColumns({ sortState, onToggleSort }), [sortState, onToggleSort]);
  const getRowClassName = React.useCallback(
    (row: HospitalRow) =>
      [
        pendingReviewAllowStatusRowClass(row.reviewStatus),
        row.id === highlightedRowId ? "bg-emerald-50/90 transition-colors duration-500" : undefined,
      ]
        .filter(Boolean)
        .join(" ") || undefined,
    [highlightedRowId],
  );

  return (
    <DataTable
      tableClassName="w-[1560px] min-w-[1560px] table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      loadingVariant="spinner"
      loadingLabel="병의원 목록 불러오는 중"
      getRowClassName={getRowClassName}
      loading={loading}
      refreshing={refreshing}
      error={error}
      meta={meta}

      onGoPage={onGoPage}
      onRowClick={onRowClick}
      emptyText="조건에 맞는 병의원이 없습니다."
    />
  );
}
