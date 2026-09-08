import React from "react";

import {
  DataTable,
  DataTableSortHeader,
  type DataTableColumn,
  type DataTableMeta,
  StatusValueBadge,
  CategoryBadgeList,
} from "@beaulab/ui-admin";

import { pendingReviewAllowStatusRowClass, reviewAllowStatusColor } from "@/lib/common/review-status";
import { labelDoctorApprovalStatus, type DoctorRow, type SortField, type SortState } from "@/lib/doctor/list";

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
        <DataTableSortHeader
          label="DID"
          active={sortState.enabled && sortState.field === "id"}
          direction={sortState.direction}
          onClick={() => onToggleSort("id")}
        />
      ),
      render: (row) => row.id,
    },
    {
      key: "hospitalName",
      headerClassName: `${headerBaseClass} lg:w-[140px]`,
      cellClassName: `${cellBaseClass} lg:w-[140px]`,
      header: "병의원",
      render: (row) => (
        <span className="line-clamp-2 block font-medium break-words text-gray-800" title={row.hospitalName}>
          {row.hospitalName}
        </span>
      ),
    },
    {
      key: "name",
      headerClassName: `${headerBaseClass} lg:w-[196px]`,
      cellClassName: `${cellBaseClass} lg:w-[196px]`,
      header: (
        <DataTableSortHeader
          label="의료진"
          active={sortState.enabled && sortState.field === "name"}
          direction={sortState.direction}
          onClick={() => onToggleSort("name")}
        />
      ),
      render: (row) => (
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-400">
            {row.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
              <img
                src={row.profileImageUrl}
                alt={`${row.name} 프로필`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              "사진"
            )}
          </div>
          <span className="line-clamp-2 block min-w-0 flex-1 font-medium break-words text-gray-800" title={row.name}>
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
        <DataTableSortHeader
          label="전문의"
          active={sortState.enabled && sortState.field === "specialist_field"}
          direction={sortState.direction}
          onClick={() => onToggleSort("specialist_field")}
        />
      ),
      render: (row) => row.specialistLabel,
    },
    {
      key: "licenseNumber",
      headerClassName: `${headerBaseClass} lg:w-[110px]`,
      cellClassName: `${cellBaseClass} lg:w-[110px]`,
      header: "면허번호",
      render: (row) => (
        <span className="line-clamp-2 block break-all text-gray-700" title={row.licenseNumber}>
          {row.licenseNumber}
        </span>
      ),
    },
    {
      key: "position",
      headerClassName: `${headerBaseClass} lg:w-[76px]`,
      cellClassName: `${nowrapCellClass} lg:w-[76px]`,
      header: (
        <DataTableSortHeader
          label="직책"
          active={sortState.enabled && sortState.field === "position"}
          direction={sortState.direction}
          onClick={() => onToggleSort("position")}
        />
      ),
      render: (row) => row.position,
    },
    {
      key: "gender",
      headerClassName: `${headerBaseClass} lg:w-[46px]`,
      cellClassName: `${nowrapCellClass} lg:w-[46px]`,
      header: (
        <DataTableSortHeader
          label="성별"
          active={sortState.enabled && sortState.field === "gender"}
          direction={sortState.direction}
          onClick={() => onToggleSort("gender")}
        />
      ),
      render: (row) => row.genderLabel,
    },
    {
      key: "categories",
      headerClassName: `${headerBaseClass} lg:w-[130px]`,
      cellClassName: `${cellBaseClass} lg:w-[130px]`,
      header: "진료분야",
      render: (row) => <CategoryBadgeList values={row.categoryNames} />,
    },
    {
      key: "careerPeriod",
      headerClassName: `${headerBaseClass} lg:w-[84px]`,
      cellClassName: `${nowrapCellClass} lg:w-[84px]`,
      header: (
        <DataTableSortHeader
          label="경력기간"
          active={sortState.enabled && sortState.field === "career_years"}
          direction={sortState.direction}
          onClick={() => onToggleSort("career_years")}
        />
      ),
      render: (row) => row.careerPeriodLabel,
    },
    {
      key: "approvalStatus",
      headerClassName: `${headerBaseClass} lg:w-[76px]`,
      cellClassName: `${nowrapCellClass} lg:w-[76px]`,
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
          label={labelDoctorApprovalStatus(row.approvalStatus)}
          color={reviewAllowStatusColor(row.approvalStatus)}
        />
      ),
    },
    {
      key: "createdAt",
      headerClassName: `${headerBaseClass} lg:w-[96px]`,
      cellClassName: `${nowrapCellClass} lg:w-[96px]`,
      header: (
        <DataTableSortHeader
          label="등록일"
          active={sortState.enabled && sortState.field === "created_at"}
          direction={sortState.direction}
          onClick={() => onToggleSort("created_at")}
        />
      ),
      render: (row) => row.createdAt,
    },
    {
      key: "reviewCount",
      headerClassName: `${headerBaseClass} lg:w-[58px]`,
      cellClassName: `${nowrapCellClass} lg:w-[58px]`,
      header: (
        <DataTableSortHeader
          label="후기수"
          active={sortState.enabled && sortState.field === "review_count"}
          direction={sortState.direction}
          onClick={() => onToggleSort("review_count")}
        />
      ),
      render: (row) => row.reviewCount.toLocaleString(),
    },
    {
      key: "consultationCount",
      headerClassName: `${headerBaseClass} lg:w-[58px]`,
      cellClassName: `${nowrapCellClass} lg:w-[58px]`,
      header: (
        <DataTableSortHeader
          label="상담수"
          active={sortState.enabled && sortState.field === "consultation_count"}
          direction={sortState.direction}
          onClick={() => onToggleSort("consultation_count")}
        />
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
  onGoPage,
  onRowClick,
}: DoctorsDataTableProps) {
  const columns = React.useMemo(() => buildDoctorColumns({ sortState, onToggleSort }), [sortState, onToggleSort]);
  const getRowClassName = React.useCallback(
    (row: DoctorRow) =>
      [
        pendingReviewAllowStatusRowClass(row.approvalStatus),
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
      getRowClassName={getRowClassName}
      loadingVariant="spinner"
      loadingLabel="의료진 목록 불러오는 중"
      loading={loading}
      refreshing={refreshing}
      error={error}
      meta={meta}

      onGoPage={onGoPage}
      onRowClick={onRowClick}
      emptyText="조건에 맞는 의료진이 없습니다."
    />
  );
}
