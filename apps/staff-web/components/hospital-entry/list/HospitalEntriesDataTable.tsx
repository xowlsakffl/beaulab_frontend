"use client";

import React from "react";

import {
  DataTable,
  DataTableSortHeader,
  type DataTableColumn,
  type DataTableMeta,
  StatusValueBadge,
} from "@beaulab/ui-admin";

import { pendingReviewAllowStatusRowClass, reviewAllowStatusColor } from "@/lib/common/review-status";
import {
  labelHospitalEntryAllowStatus,
  type HospitalEntryRow,
  type SortField,
  type SortState,
} from "@/lib/hospital-entry/list";

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
        <DataTableSortHeader
          label="ID"
          active={sortState.enabled && sortState.field === "id"}
          direction={sortState.direction}
          onClick={() => onToggleSort("id")}
        />
      ),
      render: (row) => row.id,
    },
    {
      key: "requestedAt",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${nowrapCellClass} lg:w-[120px]`,
      header: (
        <DataTableSortHeader
          label="신청일"
          active={sortState.enabled && sortState.field === "created_at"}
          direction={sortState.direction}
          onClick={() => onToggleSort("created_at")}
        />
      ),
      render: (row) => row.requestedAt,
    },
    {
      key: "hospitalName",
      headerClassName: `${headerBaseClass} lg:w-[220px]`,
      cellClassName: `${cellBaseClass} lg:w-[220px]`,
      header: (
        <DataTableSortHeader
          label="병의원명"
          active={sortState.enabled && sortState.field === "hospital_name"}
          direction={sortState.direction}
          onClick={() => onToggleSort("hospital_name")}
        />
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
        <DataTableSortHeader
          label="주소"
          active={sortState.enabled && sortState.field === "address"}
          direction={sortState.direction}
          onClick={() => onToggleSort("address")}
        />
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
        <DataTableSortHeader
          label="대표자"
          active={sortState.enabled && sortState.field === "ceo_name"}
          direction={sortState.direction}
          onClick={() => onToggleSort("ceo_name")}
        />
      ),
      render: (row) => row.ceoName,
    },
    {
      key: "applicantName",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${nowrapCellClass} lg:w-[120px]`,
      header: (
        <DataTableSortHeader
          label="신청자"
          active={sortState.enabled && sortState.field === "applicant_name"}
          direction={sortState.direction}
          onClick={() => onToggleSort("applicant_name")}
        />
      ),
      render: (row) => row.applicantName,
    },
    {
      key: "allowStatus",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${nowrapCellClass} lg:w-[120px]`,
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
          label={labelHospitalEntryAllowStatus(row.allowStatus)}
          color={reviewAllowStatusColor(row.allowStatus)}
        />
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
      emptyText="조건에 맞는 입점신청이 없습니다."
    />
  );
}
