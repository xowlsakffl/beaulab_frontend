"use client";

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
  hospitalEntryAllowStatusColor,
  labelHospitalEntryAllowStatus,
  type HospitalEntryRow,
  type SortField,
  type SortState,
} from "@/lib/hospital-entry/list";
import { pendingReviewAllowStatusRowClass } from "@/lib/common/review-status";

function renderSortMark(field: SortField, sortState: SortState) {
  if (!sortState.enabled || sortState.field !== field) {
    return <ChevronsUpDown className="size-4" />;
  }

  return sortState.direction === "desc" ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />;
}

function buildHospitalEntryColumns({
  sortState,
  onToggleSort,
}: {
  sortState: SortState;
  onToggleSort: (field: SortField) => void;
}): DataTableColumn<HospitalEntryRow>[] {
  const headerBaseClass = "px-2 py-3 text-left font-semibold text-theme-xs text-gray-600";
  const cellBaseClass = "px-2 py-4 text-start align-top";
  const nowrapCellClass = `${cellBaseClass} overflow-hidden text-ellipsis whitespace-nowrap`;

  return [
    {
      key: "id",
      headerClassName: `${headerBaseClass} lg:w-[70px]`,
      cellClassName: `${nowrapCellClass} lg:w-[70px]`,
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
      key: "requestedAt",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${nowrapCellClass} lg:w-[120px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("created_at")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          신청일 <span className="text-xs text-gray-400">{renderSortMark("created_at", sortState)}</span>
        </Button>
      ),
      render: (row) => row.requestedAt,
    },
    {
      key: "hospitalName",
      headerClassName: `${headerBaseClass} lg:w-[220px]`,
      cellClassName: `${cellBaseClass} lg:w-[220px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("hospital_name")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          병의원명 <span className="text-xs text-gray-400">{renderSortMark("hospital_name", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <span className="line-clamp-2 block font-medium break-words text-gray-800" title={row.hospitalName}>
          {row.hospitalName}
        </span>
      ),
    },
    {
      key: "address",
      headerClassName: `${headerBaseClass} lg:w-[360px]`,
      cellClassName: `${cellBaseClass} lg:w-[360px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("address")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          주소 <span className="text-xs text-gray-400">{renderSortMark("address", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <span className="line-clamp-2 block break-words text-gray-700" title={row.address}>
          {row.address}
        </span>
      ),
    },
    {
      key: "ceoName",
      headerClassName: `${headerBaseClass} lg:w-[110px]`,
      cellClassName: `${nowrapCellClass} lg:w-[110px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("ceo_name")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          대표자 <span className="text-xs text-gray-400">{renderSortMark("ceo_name", sortState)}</span>
        </Button>
      ),
      render: (row) => row.ceoName,
    },
    {
      key: "applicantName",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${nowrapCellClass} lg:w-[120px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("applicant_name")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          신청자 <span className="text-xs text-gray-400">{renderSortMark("applicant_name", sortState)}</span>
        </Button>
      ),
      render: (row) => row.applicantName,
    },
    {
      key: "allowStatus",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${nowrapCellClass} lg:w-[120px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("allow_status")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          검수상태 <span className="text-xs text-gray-400">{renderSortMark("allow_status", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <StatusBadge size="sm" color={hospitalEntryAllowStatusColor(row.allowStatus)}>
          {labelHospitalEntryAllowStatus(row.allowStatus)}
        </StatusBadge>
      ),
    },
  ];
}

type HospitalEntriesDataTableProps = {
  rows: HospitalEntryRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  sortState: SortState;
  onToggleSort: (field: SortField) => void;
  onGoPage: (page: number) => void;
  onRowClick: (row: HospitalEntryRow) => void;
};

export function HospitalEntriesDataTable({
  rows,
  meta,
  loading,
  refreshing,
  error,
  sortState,
  onToggleSort,
  onGoPage,
  onRowClick,
}: HospitalEntriesDataTableProps) {
  const columns = React.useMemo(
    () => buildHospitalEntryColumns({ sortState, onToggleSort }),
    [sortState, onToggleSort],
  );

  return (
    <DataTable
      tableClassName="w-[1120px] min-w-[1120px] table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      getRowClassName={(row) => pendingReviewAllowStatusRowClass(row.allowStatus)}
      loadingVariant="spinner"
      loadingLabel="입점신청 목록 불러오는 중"
      loading={loading}
      refreshing={refreshing}
      error={error}
      meta={meta}

      onGoPage={onGoPage}
      onRowClick={onRowClick}
      footerCenter={
        meta ? (
          <Pagination
            currentPage={meta.current_page}
            totalPages={Math.max(1, meta.last_page)}
            onPageChange={onGoPage}
            disabled={refreshing}
          />
        ) : null
      }
      emptyText="조건에 맞는 입점신청이 없습니다."
    />
  );
}
