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

import { CategoryBadgeList } from "@beaulab/ui-admin";
import {
  formatHospitalEventPoint,
  formatHospitalEventPrice,
  labelHospitalEventAllowStatus,
  labelHospitalEventVisibilityStatus,
  type HospitalEventRow,
  type HospitalEventSortField,
  type HospitalEventSortState,
} from "@/lib/hospital-event/list";

function renderSortMark(field: HospitalEventSortField, sortState: HospitalEventSortState) {
  if (!sortState.enabled || sortState.field !== field) return <ChevronsUpDown className="size-4" />;
  return sortState.direction === "desc" ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />;
}

function allowStatusColor(status: string): "success" | "warning" | "error" | "info" | "light" {
  if (status === "APPROVED") return "success";
  if (status === "PENDING" || status === "REVIEWING") return "warning";
  if (status === "REJECTED" || status === "PARTNER_CANCELED") return "error";

  return "light";
}

function categoryBadges(categoryLabel: string) {
  return <CategoryBadgeList values={[categoryLabel]} title={categoryLabel} />;
}

function EventInlineActionButton({
  children,
  disabled = true,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className="h-8 min-w-12 border-gray-200 bg-white px-3 text-xs font-medium text-gray-500 disabled:opacity-60 "
    >
      {children}
    </Button>
  );
}

function buildHospitalEventColumns({
  sortState,
  onToggleSort,
  onEditPeriod,
}: {
  sortState: HospitalEventSortState;
  onToggleSort: (field: HospitalEventSortField) => void;
  onEditPeriod: (row: HospitalEventRow) => void;
}): DataTableColumn<HospitalEventRow>[] {
  const headerBaseClass = "px-2 py-3 text-left font-semibold text-theme-xs text-gray-600 ";
  const cellBaseClass = "px-2 py-4 text-start align-top ";
  const nowrapCellClass = `${cellBaseClass} overflow-hidden text-ellipsis whitespace-nowrap`;

  return [
    {
      key: "id",
      headerClassName: `${headerBaseClass} lg:w-[58px]`,
      cellClassName: `${nowrapCellClass} lg:w-[58px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("id")} className="inline-flex items-center gap-1 px-0 text-xs">
          EID <span className="text-xs text-gray-400">{renderSortMark("id", sortState)}</span>
        </Button>
      ),
      render: (row) => row.id,
    },
    {
      key: "hospital",
      headerClassName: `${headerBaseClass} lg:w-[130px]`,
      cellClassName: `${cellBaseClass} lg:w-[130px]`,
      header: "병의원",
      render: (row) => (
        <span className="line-clamp-2 break-words font-medium text-gray-800 " title={row.hospitalName}>
          {row.hospitalName}
        </span>
      ),
    },
    {
      key: "categories",
      headerClassName: `${headerBaseClass} lg:w-[150px]`,
      cellClassName: `${cellBaseClass} lg:w-[150px]`,
      header: "카테고리",
      render: (row) => categoryBadges(row.categoryLabel),
    },
    {
      key: "event",
      headerClassName: `${headerBaseClass} lg:w-[230px]`,
      cellClassName: `${cellBaseClass} lg:w-[230px]`,
      header: "이벤트",
      render: (row) => (
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-400">
            {row.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
              <img src={row.thumbnailUrl} alt={`${row.name} 썸네일`} className="h-full w-full object-cover" />
            ) : (
              "썸네일"
            )}
          </div>
          <div className="relative min-h-20 min-w-0 flex-1 pb-9">
            <span className="block line-clamp-2 break-words font-medium text-gray-800 " title={row.name}>
              {row.name}
            </span>
            <div className="absolute bottom-0 right-0">
              <EventInlineActionButton>복제</EventInlineActionButton>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "period",
      headerClassName: `${headerBaseClass} lg:w-[150px]`,
      cellClassName: `${cellBaseClass} lg:w-[150px]`,
      header: "기간",
      render: (row) => (
        <div className="relative min-h-20 pb-9">
          <span className="block whitespace-pre-line text-gray-700 ">{row.periodLabel}</span>
          <div className="absolute bottom-0 right-0">
            <EventInlineActionButton disabled={false} onClick={() => onEditPeriod(row)}>
              수정
            </EventInlineActionButton>
          </div>
        </div>
      ),
    },
    {
      key: "eventPrice",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${nowrapCellClass} lg:w-[120px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("event_price")} className="inline-flex items-center gap-1 px-0 text-xs">
          이벤트가격 <span className="text-xs text-gray-400">{renderSortMark("event_price", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <span>
          {formatHospitalEventPrice(row.eventPrice)}{" "}
          <span className="font-semibold text-brand-500">{row.discountRate}%</span>
        </span>
      ),
    },
    {
      key: "consultationCount",
      headerClassName: `${headerBaseClass} lg:w-[92px]`,
      cellClassName: `${nowrapCellClass} lg:w-[92px]`,
      header: "상담신청수",
      render: (row) => `${row.confirmedConsultationCount.toLocaleString()}/${row.consultationCount.toLocaleString()}건`,
    },
    {
      key: "totalSpentPoint",
      headerClassName: `${headerBaseClass} lg:w-[100px]`,
      cellClassName: `${nowrapCellClass} lg:w-[100px]`,
      header: "총 소진금액",
      render: (row) => formatHospitalEventPoint(row.totalSpentPoint),
    },
    {
      key: "status",
      headerClassName: `${headerBaseClass} lg:w-[72px]`,
      cellClassName: `${nowrapCellClass} lg:w-[72px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("status")} className="inline-flex items-center gap-1 px-0 text-xs">
          노출여부 <span className="text-xs text-gray-400">{renderSortMark("status", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <StatusBadge size="sm" color={row.status === "ACTIVE" ? "success" : "error"}>
          {labelHospitalEventVisibilityStatus(row.status)}
        </StatusBadge>
      ),
    },
    {
      key: "allowStatus",
      headerClassName: `${headerBaseClass} lg:w-[88px]`,
      cellClassName: `${nowrapCellClass} lg:w-[88px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("allow_status")} className="inline-flex items-center gap-1 px-0 text-xs">
          검수상태 <span className="text-xs text-gray-400">{renderSortMark("allow_status", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <StatusBadge size="sm" color={allowStatusColor(row.allowStatus)}>
          {labelHospitalEventAllowStatus(row.allowStatus)}
        </StatusBadge>
      ),
    },
    {
      key: "viewCount",
      headerClassName: `${headerBaseClass} lg:w-[70px]`,
      cellClassName: `${nowrapCellClass} lg:w-[70px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("view_count")} className="inline-flex items-center gap-1 px-0 text-xs">
          조회수 <span className="text-xs text-gray-400">{renderSortMark("view_count", sortState)}</span>
        </Button>
      ),
      render: (row) => row.viewCount.toLocaleString(),
    },
    {
      key: "manager",
      headerClassName: `${headerBaseClass} lg:w-[90px]`,
      cellClassName: `${cellBaseClass} lg:w-[90px]`,
      header: "담당자",
      render: (row) => (
        <span className="line-clamp-2 break-words text-gray-700 " title={row.managerName}>
          {row.managerName}
        </span>
      ),
    },
  ];
}

type HospitalEventsDataTableProps = {
  rows: HospitalEventRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  sortState: HospitalEventSortState;
  onToggleSort: (field: HospitalEventSortField) => void;
  onEditPeriod: (row: HospitalEventRow) => void;
  onRefresh: () => void;
  onGoPage: (page: number) => void;
};

export function HospitalEventsDataTable({
  rows,
  meta,
  loading,
  refreshing,
  error,
  sortState,
  onToggleSort,
  onEditPeriod,
  onRefresh,
  onGoPage,
}: HospitalEventsDataTableProps) {
  const columns = React.useMemo(
    () => buildHospitalEventColumns({ sortState, onToggleSort, onEditPeriod }),
    [sortState, onToggleSort, onEditPeriod],
  );

  return (
    <DataTable
      refreshPlacement="left"
      tableClassName="w-full table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      loadingVariant="spinner"
      loadingLabel="이벤트 목록 불러오는 중"
      loading={loading}
      refreshing={refreshing}
      error={error}
      meta={meta}
      onRefresh={onRefresh}
      onGoPage={onGoPage}
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
    />
  );
}
