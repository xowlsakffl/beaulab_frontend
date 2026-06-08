import React from "react";

import {
  Button,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  DataTable,
  Pagination,
  StatusBadge,
  type DataTableColumn,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import {
  labelApprovalStatus,
  labelReviewStatus,
  type HospitalRow,
  type SortField,
  type SortState,
} from "@/lib/hospital/list";

function renderSortMark(field: SortField, sortState: SortState) {
  if (!sortState.enabled || sortState.field !== field) return <ChevronsUpDown className="size-4" />;
  return sortState.direction === "desc" ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />;
}

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
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("id")} className="inline-flex items-center gap-1 px-0 text-xs">
          UID <span className="text-xs text-gray-400">{renderSortMark("id", sortState)}</span>
        </Button>
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
      headerClassName: `${headerBaseClass} lg:w-[170px]`,
      cellClassName: `${cellBaseClass} lg:w-[170px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("name")} className="inline-flex items-center gap-1 px-0 text-xs">
          병의원 <span className="text-xs text-gray-400">{renderSortMark("name", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-[10px] font-semibold text-gray-400">
            {row.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
              <img src={row.logoUrl} alt={`${row.name} 로고`} className="h-full w-full object-cover" />
            ) : (
              "로고"
            )}
          </div>
          <span className="block min-w-0 flex-1 line-clamp-2 break-words font-medium text-gray-800 " title={row.name}>
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
        <span className="block line-clamp-2 break-all text-gray-700 " title={row.loginId}>
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
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("evaluation_count")} className="inline-flex items-center gap-1 px-0 text-xs">
          병의원평가 <span className="text-xs text-gray-400">{renderSortMark("evaluation_count", sortState)}</span>
        </Button>
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
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("view_count")} className="inline-flex items-center gap-1 px-0 text-xs">
          조회수 <span className="text-xs text-gray-400">{renderSortMark("view_count", sortState)}</span>
        </Button>
      ),
      render: (row) => row.viewCount.toLocaleString(),
    },
    {
      key: "hospitalStatus",
      headerClassName: `${spacedHeaderClass} lg:w-[76px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[76px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("status")} className="inline-flex items-center gap-1 px-0 text-xs">
          회원상태 <span className="text-xs text-gray-400">{renderSortMark("status", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <StatusBadge size="sm" color={row.hospitalStatus === "ACTIVE" ? "success" : row.hospitalStatus === "SUSPENDED" ? "warning" : "error"}>
          {labelApprovalStatus(row.hospitalStatus)}
        </StatusBadge>
      ),
    },
    {
      key: "reviewStatus",
      headerClassName: `${spacedHeaderClass} lg:w-[68px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[68px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("allow_status")} className="inline-flex items-center gap-1 px-0 text-xs">
          검수상태 <span className="text-xs text-gray-400">{renderSortMark("allow_status", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <StatusBadge size="sm" color={row.reviewStatus === "APPROVED" ? "success" : row.reviewStatus === "PENDING" ? "warning" : "error"}>
          {labelReviewStatus(row.reviewStatus)}
        </StatusBadge>
      ),
    },
    {
      key: "lastLoginAt",
      headerClassName: `${spacedHeaderClass} lg:w-[110px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[110px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("last_login_at")} className="inline-flex items-center gap-1 px-0 text-xs">
          최근접속일 <span className="text-xs text-gray-400">{renderSortMark("last_login_at", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <span>{row.lastLoginAt}</span>
          {row.isDormant ? (
            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              휴면
            </span>
          ) : null}
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
  onRefresh: () => void;
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
  onRefresh,
  onGoPage,
  onRowClick,
}: HospitalsDataTableProps) {
  const columns = React.useMemo(
    () => buildHospitalColumns({ sortState, onToggleSort }),
    [sortState, onToggleSort],
  );

  return (
    <DataTable
      refreshPlacement="left"
      tableClassName="w-full table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      loadingVariant="spinner"
      loadingLabel="병의원 목록 불러오는 중"
      getRowClassName={(row) =>
        row.id === highlightedRowId
          ? "bg-emerald-50/90 transition-colors duration-500 "
          : undefined
      }
      loading={loading}
      refreshing={refreshing}
      error={error}
      meta={meta}
      onRefresh={onRefresh}
      onGoPage={onGoPage}
      onRowClick={onRowClick}
      footerCenter={
        meta ? (
          <Pagination
            currentPage={meta.current_page}
            totalPages={Math.max(1, meta.last_page)}
            onPageChange={onGoPage}
            disabled={refreshing || !onGoPage}
          />
        ) : null
      }
      emptyText="조건에 맞는 병의원이 없습니다."
    />
  );
}
