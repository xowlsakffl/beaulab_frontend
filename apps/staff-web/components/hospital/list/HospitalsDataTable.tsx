import React from "react";

import {
  Button,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  DataTable,
  Download,
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
  const headerBaseClass = "px-3 py-3 text-left font-semibold text-theme-xs text-gray-600 dark:text-gray-300";
  const cellBaseClass = "px-3 py-4 text-start align-top dark:text-gray-200";
  const nowrapCellClass = `${cellBaseClass} whitespace-nowrap`;
  const spacedHeaderClass = `${headerBaseClass} lg:pl-3`;
  const spacedNowrapCellClass = `${nowrapCellClass} lg:pl-3`;

  return [
    {
      key: "id",
      headerClassName: `${headerBaseClass} lg:w-[40px]`,
      cellClassName: `${nowrapCellClass} lg:w-[40px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("id")} className="inline-flex items-center gap-1 px-0 text-xs">
          ID <span className="text-xs text-gray-400">{renderSortMark("id", sortState)}</span>
        </Button>
      ),
      render: (row) => row.id,
    },
    {
      key: "name",
      headerClassName: `${headerBaseClass} lg:w-[150px]`,
      cellClassName: `${cellBaseClass} lg:w-[150px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("name")} className="inline-flex items-center gap-1 px-0 text-xs">
          병의원명 <span className="text-xs text-gray-400">{renderSortMark("name", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <div className="flex items-start gap-2">
          {row.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo domains come from runtime API/storage configuration
            <img
              src={row.logoUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-md border border-gray-200 object-cover dark:border-white/[0.08]"
            />
          ) : null}
          <span className="block min-w-0 truncate font-medium text-gray-800 dark:text-white/90" title={row.name}>
            {row.name}
          </span>
        </div>
      ),
    },
    {
      key: "tel",
      headerClassName: `${spacedHeaderClass} lg:w-[116px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[116px]`,
      header: "대표 연락처",
      render: (row) => row.tel,
    },
    {
      key: "approvalStatus",
      headerClassName: `${spacedHeaderClass} lg:w-[72px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[72px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("status")} className="inline-flex items-center gap-1 px-0 text-xs">
          운영 상태 <span className="text-xs text-gray-400">{renderSortMark("status", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <StatusBadge size="sm" color={row.approvalStatus === "ACTIVE" ? "success" : row.approvalStatus === "SUSPENDED" ? "warning" : "error"}>
          {labelApprovalStatus(row.approvalStatus)}
        </StatusBadge>
      ),
    },
    {
      key: "reviewStatus",
      headerClassName: `${spacedHeaderClass} lg:w-[72px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[72px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("allow_status")} className="inline-flex items-center gap-1 px-0 text-xs">
          검수 상태 <span className="text-xs text-gray-400">{renderSortMark("allow_status", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <StatusBadge size="sm" color={row.reviewStatus === "APPROVED" ? "success" : row.reviewStatus === "PENDING" ? "warning" : "error"}>
          {labelReviewStatus(row.reviewStatus)}
        </StatusBadge>
      ),
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
      key: "updatedAt",
      headerClassName: `${spacedHeaderClass} lg:w-[82px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[82px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("updated_at")} className="inline-flex items-center gap-1 px-0 text-xs">
          수정일 <span className="text-xs text-gray-400">{renderSortMark("updated_at", sortState)}</span>
        </Button>
      ),
      render: (row) => row.updatedAt,
    },
    {
      key: "createdAt",
      headerClassName: `${spacedHeaderClass} lg:w-[82px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[82px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("created_at")} className="inline-flex items-center gap-1 px-0 text-xs">
          등록일 <span className="text-xs text-gray-400">{renderSortMark("created_at", sortState)}</span>
        </Button>
      ),
      render: (row) => row.createdAt,
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
      title="병의원 목록"
      description="검색어와 필터를 설정한 뒤 검색을 눌러 적용하세요."
      tableClassName="min-w-[860px] w-full lg:min-w-0 lg:table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      loadingVariant="spinner"
      loadingLabel="병의원 목록 불러오는 중"
      getRowClassName={(row) =>
        row.id === highlightedRowId
          ? "bg-emerald-50/90 transition-colors duration-500 dark:bg-emerald-500/10"
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
      footerRight={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 border-brand-500 px-5 text-brand-500 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
        >
          <Download className="size-5" />
          <span>다운로드</span>
        </Button>
      }
      emptyText="조건에 맞는 병의원이 없습니다."
    />
  );
}
