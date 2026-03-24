import React from "react";

import {
  Button,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  DataTable,
  Select,
  StatusBadge,
  X,
  type DataTableColumn,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import {
  PER_PAGE_OPTIONS,
  labelDoctorApprovalStatus,
  labelDoctorOperatingStatus,
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
  const headerBaseClass =
    "px-3 py-3 text-left font-semibold text-theme-xs text-gray-600 dark:text-gray-300";
  const cellBaseClass = "px-3 py-4 text-start align-top dark:text-gray-200";
  const nowrapCellClass = `${cellBaseClass} whitespace-nowrap`;

  return [
    {
      key: "id",
      headerClassName: `${headerBaseClass} lg:w-[64px]`,
      cellClassName: `${nowrapCellClass} lg:w-[64px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("id")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          ID <span className="text-xs text-gray-400">{renderSortMark("id", sortState)}</span>
        </Button>
      ),
      render: (row) => row.id,
    },
    {
      key: "hospitalName",
      headerClassName: `${headerBaseClass} lg:w-[180px]`,
      cellClassName: `${cellBaseClass} lg:w-[180px]`,
      header: "소속 병원",
      render: (row) => (
        <span
          className="block truncate font-medium text-gray-800 dark:text-white/90"
          title={row.hospitalName}
        >
          {row.hospitalName}
        </span>
      ),
    },
    {
      key: "name",
      headerClassName: `${headerBaseClass} lg:w-[180px]`,
      cellClassName: `${cellBaseClass} lg:w-[180px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("name")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          의료진명 <span className="text-xs text-gray-400">{renderSortMark("name", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- image domains come from runtime API/storage configuration
            <img
              src={row.profileImageUrl}
              alt={row.name}
              className="h-10 w-10 shrink-0 rounded-md border border-gray-200 object-cover dark:border-white/[0.08]"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-dashed border-gray-300 text-[10px] text-gray-400 dark:border-white/[0.08] dark:text-gray-500">
              없음
            </div>
          )}
          <span
            className="block truncate font-medium text-gray-800 dark:text-white/90"
            title={row.name}
          >
            {row.name}
          </span>
        </div>
      ),
    },
    {
      key: "gender",
      headerClassName: `${headerBaseClass} lg:w-[78px]`,
      cellClassName: `${nowrapCellClass} lg:w-[78px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("gender")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          성별 <span className="text-xs text-gray-400">{renderSortMark("gender", sortState)}</span>
        </Button>
      ),
      render: (row) => row.genderLabel,
    },
    {
      key: "position",
      headerClassName: `${headerBaseClass} lg:w-[110px]`,
      cellClassName: `${nowrapCellClass} lg:w-[110px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("position")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          직책 <span className="text-xs text-gray-400">{renderSortMark("position", sortState)}</span>
        </Button>
      ),
      render: (row) => row.position,
    },
    {
      key: "isSpecialist",
      headerClassName: `${headerBaseClass} lg:w-[110px]`,
      cellClassName: `${nowrapCellClass} lg:w-[110px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("is_specialist")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          전문의 여부 <span className="text-xs text-gray-400">{renderSortMark("is_specialist", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <StatusBadge
          size="sm"
          color={row.isSpecialist ? "success" : "error"}
          startIcon={row.isSpecialist ? <Check className="size-3.5" /> : <X className="size-3.5" />}
        />
      ),
    },
    {
      key: "careerPeriod",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${nowrapCellClass} lg:w-[120px]`,
      header: "경력기간",
      render: (row) => row.careerPeriodLabel,
    },
    {
      key: "approvalStatus",
      headerClassName: `${headerBaseClass} lg:w-[100px]`,
      cellClassName: `${nowrapCellClass} lg:w-[100px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("allow_status")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          승인상태 <span className="text-xs text-gray-400">{renderSortMark("allow_status", sortState)}</span>
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
      key: "operatingStatus",
      headerClassName: `${headerBaseClass} lg:w-[100px]`,
      cellClassName: `${nowrapCellClass} lg:w-[100px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("status")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          운영상태 <span className="text-xs text-gray-400">{renderSortMark("status", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <StatusBadge
          size="sm"
          color={
            row.operatingStatus === "ACTIVE"
              ? "success"
              : row.operatingStatus === "SUSPENDED"
                ? "warning"
                : "error"
          }
        >
          {labelDoctorOperatingStatus(row.operatingStatus)}
        </StatusBadge>
      ),
    },
    {
      key: "viewCount",
      headerClassName: `${headerBaseClass} lg:w-[90px]`,
      cellClassName: `${nowrapCellClass} lg:w-[90px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("view_count")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          조회수 <span className="text-xs text-gray-400">{renderSortMark("view_count", sortState)}</span>
        </Button>
      ),
      render: (row) => row.viewCount.toLocaleString(),
    },
    {
      key: "createdAt",
      headerClassName: `${headerBaseClass} lg:w-[96px]`,
      cellClassName: `${nowrapCellClass} lg:w-[96px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("created_at")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          등록일 <span className="text-xs text-gray-400">{renderSortMark("created_at", sortState)}</span>
        </Button>
      ),
      render: (row) => row.createdAt,
    },
    {
      key: "updatedAt",
      headerClassName: `${headerBaseClass} lg:w-[96px]`,
      cellClassName: `${nowrapCellClass} lg:w-[96px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("updated_at")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          수정일 <span className="text-xs text-gray-400">{renderSortMark("updated_at", sortState)}</span>
        </Button>
      ),
      render: (row) => row.updatedAt,
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
  perPage: number;
  onToggleSort: (field: SortField) => void;
  onRefresh: () => void;
  onGoPage: (page: number) => void;
  onPerPageChange: (value: number) => void;
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
  perPage,
  onToggleSort,
  onRefresh,
  onGoPage,
  onPerPageChange,
  onRowClick,
}: DoctorsDataTableProps) {
  const columns = React.useMemo(
    () => buildDoctorColumns({ sortState, onToggleSort }),
    [sortState, onToggleSort],
  );

  return (
    <DataTable
      title="의료진 목록"
      description="소속 병원, 승인 상태, 운영 상태와 기본 프로필 정보를 확인할 수 있습니다."
      tableClassName="min-w-[1440px] w-full lg:min-w-0 lg:table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      getRowClassName={(row) =>
        row.id === highlightedRowId
          ? "bg-emerald-50/90 transition-colors duration-500 dark:bg-emerald-500/10"
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
      rightActions={(
        <div className="flex items-center gap-2">
          <Select
            defaultValue={String(perPage)}
            options={PER_PAGE_OPTIONS}
            showPlaceholderOption={false}
            onChange={(value) => onPerPageChange(Number(value))}
            placeholder="개수 선택"
            className="w-[70px] px-2 text-xs"
          />
        </div>
      )}
      emptyText="조건에 맞는 의료진이 없습니다."
    />
  );
}
