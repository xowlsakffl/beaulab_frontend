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

import { CategoryBadgeList } from "@beaulab/ui-admin";
import {
  labelDoctorApprovalStatus,
  type DoctorRow,
  type SortField,
  type SortState,
} from "@/lib/doctor/list";

function renderSortMark(field: SortField, sortState: SortState) {
  if (!sortState.enabled || sortState.field !== field) {
    return <ChevronsUpDown className="size-4" />;
  }

  return sortState.direction === "desc"
    ? <ChevronDown className="size-4" />
    : <ChevronUp className="size-4" />;
}

function buildDoctorColumns({
  sortState,
  onToggleSort,
}: {
  sortState: SortState;
  onToggleSort: (field: SortField) => void;
}): DataTableColumn<DoctorRow>[] {
  const headerBaseClass = "px-2 py-3 text-left font-semibold text-theme-xs text-gray-600 ";
  const cellBaseClass = "px-2 py-4 text-start align-top ";
  const nowrapCellClass = `${cellBaseClass} overflow-hidden text-ellipsis whitespace-nowrap`;

  return [
    {
      key: "id",
      headerClassName: `${headerBaseClass} lg:w-[52px]`,
      cellClassName: `${nowrapCellClass} lg:w-[52px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("id")} className="inline-flex items-center gap-1 px-0 text-xs">
          DID <span className="text-xs text-gray-400">{renderSortMark("id", sortState)}</span>
        </Button>
      ),
      render: (row) => row.id,
    },
    {
      key: "hospitalName",
      headerClassName: `${headerBaseClass} lg:w-[140px]`,
      cellClassName: `${cellBaseClass} lg:w-[140px]`,
      header: "병의원",
      render: (row) => (
        <span className="block line-clamp-2 break-words font-medium text-gray-800 " title={row.hospitalName}>
          {row.hospitalName}
        </span>
      ),
    },
    {
      key: "name",
      headerClassName: `${headerBaseClass} lg:w-[196px]`,
      cellClassName: `${cellBaseClass} lg:w-[196px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("name")} className="inline-flex items-center gap-1 px-0 text-xs">
          의료진 <span className="text-xs text-gray-400">{renderSortMark("name", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-400">
            {row.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
              <img src={row.profileImageUrl} alt={`${row.name} 프로필`} className="h-full w-full object-cover" />
            ) : (
              "사진"
            )}
          </div>
          <span className="block min-w-0 flex-1 line-clamp-2 break-words font-medium text-gray-800 " title={row.name}>
            {row.name}
          </span>
        </div>
      ),
    },
    {
      key: "specialist",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${nowrapCellClass} lg:w-[120px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("specialist_field")} className="inline-flex items-center gap-1 px-0 text-xs">
          전문의 <span className="text-xs text-gray-400">{renderSortMark("specialist_field", sortState)}</span>
        </Button>
      ),
      render: (row) => row.specialistLabel,
    },
    {
      key: "licenseNumber",
      headerClassName: `${headerBaseClass} lg:w-[110px]`,
      cellClassName: `${cellBaseClass} lg:w-[110px]`,
      header: "면허번호",
      render: (row) => (
        <span className="block line-clamp-2 break-all text-gray-700 " title={row.licenseNumber}>
          {row.licenseNumber}
        </span>
      ),
    },
    {
      key: "position",
      headerClassName: `${headerBaseClass} lg:w-[76px]`,
      cellClassName: `${nowrapCellClass} lg:w-[76px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("position")} className="inline-flex items-center gap-1 px-0 text-xs">
          직책 <span className="text-xs text-gray-400">{renderSortMark("position", sortState)}</span>
        </Button>
      ),
      render: (row) => row.position,
    },
    {
      key: "gender",
      headerClassName: `${headerBaseClass} lg:w-[46px]`,
      cellClassName: `${nowrapCellClass} lg:w-[46px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("gender")} className="inline-flex items-center gap-1 px-0 text-xs">
          성별 <span className="text-xs text-gray-400">{renderSortMark("gender", sortState)}</span>
        </Button>
      ),
      render: (row) => row.genderLabel,
    },
    {
      key: "categories",
      headerClassName: `${headerBaseClass} lg:w-[130px]`,
      cellClassName: `${cellBaseClass} lg:w-[130px]`,
      header: "진료분야",
      render: (row) =>
        <CategoryBadgeList values={row.categoryNames} />,
    },
    {
      key: "careerPeriod",
      headerClassName: `${headerBaseClass} lg:w-[84px]`,
      cellClassName: `${nowrapCellClass} lg:w-[84px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("career_years")} className="inline-flex items-center gap-1 px-0 text-xs">
          경력기간 <span className="text-xs text-gray-400">{renderSortMark("career_years", sortState)}</span>
        </Button>
      ),
      render: (row) => row.careerPeriodLabel,
    },
    {
      key: "approvalStatus",
      headerClassName: `${headerBaseClass} lg:w-[76px]`,
      cellClassName: `${nowrapCellClass} lg:w-[76px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("allow_status")} className="inline-flex items-center gap-1 px-0 text-xs">
          검수상태 <span className="text-xs text-gray-400">{renderSortMark("allow_status", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <StatusBadge
          size="sm"
          color={
            row.approvalStatus === "APPROVED"
              ? "success"
              : row.approvalStatus === "PENDING"
                ? "warning"
                : "error"
          }
        >
          {labelDoctorApprovalStatus(row.approvalStatus)}
        </StatusBadge>
      ),
    },
    {
      key: "createdAt",
      headerClassName: `${headerBaseClass} lg:w-[96px]`,
      cellClassName: `${nowrapCellClass} lg:w-[96px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("created_at")} className="inline-flex items-center gap-1 px-0 text-xs">
          등록일 <span className="text-xs text-gray-400">{renderSortMark("created_at", sortState)}</span>
        </Button>
      ),
      render: (row) => row.createdAt,
    },
    {
      key: "reviewCount",
      headerClassName: `${headerBaseClass} lg:w-[58px]`,
      cellClassName: `${nowrapCellClass} lg:w-[58px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("review_count")} className="inline-flex items-center gap-1 px-0 text-xs">
          후기수 <span className="text-xs text-gray-400">{renderSortMark("review_count", sortState)}</span>
        </Button>
      ),
      render: (row) => row.reviewCount.toLocaleString(),
    },
    {
      key: "consultationCount",
      headerClassName: `${headerBaseClass} lg:w-[58px]`,
      cellClassName: `${nowrapCellClass} lg:w-[58px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("consultation_count")} className="inline-flex items-center gap-1 px-0 text-xs">
          상담수 <span className="text-xs text-gray-400">{renderSortMark("consultation_count", sortState)}</span>
        </Button>
      ),
      render: (row) => row.consultationCount.toLocaleString(),
    },
  ];
}

type DoctorsDataTableProps = {
  rows: DoctorRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  highlightedRowId: number | null;
  sortState: SortState;
  onToggleSort: (field: SortField) => void;
  onRefresh: () => void;
  onGoPage: (page: number) => void;
  onRowClick: (row: DoctorRow) => void;
};

export function DoctorsDataTable({
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
}: DoctorsDataTableProps) {
  const columns = React.useMemo(
    () => buildDoctorColumns({ sortState, onToggleSort }),
    [sortState, onToggleSort],
  );

  return (
    <DataTable
      refreshPlacement="left"
      tableClassName="w-full table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      getRowClassName={(row) =>
        row.id === highlightedRowId
          ? "bg-emerald-50/90 transition-colors duration-500 "
          : undefined
      }
      loadingVariant="spinner"
      loadingLabel="의료진 목록 불러오는 중"
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
      emptyText="조건에 맞는 의료진이 없습니다."
    />
  );
}
