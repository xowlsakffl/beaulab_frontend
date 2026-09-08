"use client";

import React from "react";
import {
  Button,
  CategoryBadgeList,
  DataTable,
  DataTableSortHeader,
  type DataTableColumn,
  type DataTableMeta,
  StatusValueBadge,
} from "@beaulab/ui-admin";
import {
  formatHospitalEventPoint,
  formatHospitalEventPrice,
  hospitalEventAdminStatusColor,
  hospitalEventAllowStatusColor,
  labelHospitalEventAdminStatus,
  labelHospitalEventAllowStatus,
  type HospitalEventRow,
  type HospitalEventSortField,
  type HospitalEventSortState,
} from "@/lib/hospital-event/list";
import { pendingReviewAllowStatusRowClass } from "@/lib/common/review-status";

function categoryBadges(row: HospitalEventRow) {
  return (
    <CategoryBadgeList
      values={
        row.categoryBadges.length > 0 ? row.categoryBadges.map((category) => category.label) : [row.categoryLabel]
      }
      primaryValues={row.categoryBadges.filter((category) => category.isPrimary).map((category) => category.label)}
      title={row.categoryLabel}
    />
  );
}

function EventInlineActionButton({
  children,
  disabled = true,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
      className="h-8 min-w-12 border-gray-300 bg-white px-3 text-xs font-medium text-gray-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-500/20 disabled:opacity-60"
    >
      {children}
    </Button>
  );
}

function buildHospitalEventColumns({
  sortState,
  canDuplicate,
  canEditPeriod,
  onToggleSort,
  onEditPeriod,
  onDuplicate,
  onOpenConsultations,
}: {
  sortState: HospitalEventSortState;
  canDuplicate: boolean;
  canEditPeriod: boolean;
  onToggleSort: (field: HospitalEventSortField) => void;
  onEditPeriod: (row: HospitalEventRow) => void;
  onDuplicate: (row: HospitalEventRow) => void;
  onOpenConsultations: (row: HospitalEventRow) => void;
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
        <DataTableSortHeader
          label="EID"
          active={sortState.enabled && sortState.field === "id"}
          direction={sortState.direction}
          onClick={() => onToggleSort("id")}
        />
      ),
      render: (row) => row.id,
    },
    {
      key: "hospital",
      headerClassName: `${headerBaseClass} lg:w-[130px]`,
      cellClassName: `${cellBaseClass} lg:w-[130px]`,
      header: "병의원",
      render: (row) => (
        <span className="line-clamp-2 font-medium break-words text-gray-800" title={row.hospitalName}>
          {row.hospitalName}
        </span>
      ),
    },
    {
      key: "categories",
      headerClassName: `${headerBaseClass} lg:w-[170px]`,
      cellClassName: `${cellBaseClass} lg:w-[170px]`,
      header: "카테고리",
      render: (row) => categoryBadges(row),
    },
    {
      key: "event",
      headerClassName: `${headerBaseClass} lg:w-[210px]`,
      cellClassName: `${cellBaseClass} lg:w-[210px]`,
      header: "이벤트",
      render: (row) => (
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-400">
            {row.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
              <img
                src={row.thumbnailUrl}
                alt={`${row.name} 썸네일`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              "썸네일"
            )}
          </div>
          <div className={`relative min-h-20 min-w-0 flex-1 ${canDuplicate ? "pb-9" : ""}`}>
            <span className="line-clamp-2 block font-medium break-words text-gray-800" title={row.name}>
              {row.name}
            </span>
            {canDuplicate ? (
              <div className="absolute right-0 bottom-0">
                <EventInlineActionButton disabled={false} onClick={() => onDuplicate(row)}>
                  복제
                </EventInlineActionButton>
              </div>
            ) : null}
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
        <div className={`relative min-h-20 ${canEditPeriod ? "pb-9" : ""}`}>
          <span className="block whitespace-pre-line text-gray-700">{row.periodLabel}</span>
          {canEditPeriod ? (
            <div className="absolute right-0 bottom-0">
              <EventInlineActionButton disabled={false} onClick={() => onEditPeriod(row)}>
                수정
              </EventInlineActionButton>
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "eventPrice",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${nowrapCellClass} lg:w-[120px]`,
      header: (
        <DataTableSortHeader
          label="이벤트가격"
          active={sortState.enabled && sortState.field === "event_price"}
          direction={sortState.direction}
          onClick={() => onToggleSort("event_price")}
        />
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
      render: (row) => (
        <div className="relative min-h-20 pb-9">
          <span>
            {row.confirmedConsultationCount.toLocaleString()}/{row.consultationCount.toLocaleString()}건
          </span>
          <div className="absolute right-0 bottom-0">
            <EventInlineActionButton disabled={false} onClick={() => onOpenConsultations(row)}>
              현황
            </EventInlineActionButton>
          </div>
        </div>
      ),
    },
    {
      key: "totalSpentPoint",
      headerClassName: `${headerBaseClass} lg:w-[100px]`,
      cellClassName: `${nowrapCellClass} lg:w-[100px]`,
      header: "총 소진금액",
      render: (row) => formatHospitalEventPoint(row.totalSpentPoint),
    },
    {
      key: "adminStatus",
      headerClassName: `${headerBaseClass} lg:w-[72px]`,
      cellClassName: `${nowrapCellClass} lg:w-[72px]`,
      header: (
        <DataTableSortHeader
          label="강제중지"
          active={sortState.enabled && sortState.field === "admin_status"}
          direction={sortState.direction}
          onClick={() => onToggleSort("admin_status")}
        />
      ),
      render: (row) => (
        <StatusValueBadge
          label={labelHospitalEventAdminStatus(row.adminStatus)}
          color={hospitalEventAdminStatusColor(row.adminStatus)}
        />
      ),
    },
    {
      key: "allowStatus",
      headerClassName: `${headerBaseClass} lg:w-[88px]`,
      cellClassName: `${nowrapCellClass} lg:w-[88px]`,
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
          label={labelHospitalEventAllowStatus(row.allowStatus)}
          color={hospitalEventAllowStatusColor(row.allowStatus)}
        />
      ),
    },
    {
      key: "viewCount",
      headerClassName: `${headerBaseClass} lg:w-[70px]`,
      cellClassName: `${nowrapCellClass} lg:w-[70px]`,
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
      key: "manager",
      headerClassName: `${headerBaseClass} lg:w-[90px]`,
      cellClassName: `${cellBaseClass} lg:w-[90px]`,
      header: "담당자",
      render: (row) => (
        <span className="line-clamp-2 break-words text-gray-700" title={row.managerName}>
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
  highlightedRowId: number | null;
  sortState: HospitalEventSortState;
  canDuplicate: boolean;
  canEditPeriod: boolean;
  onToggleSort: (field: HospitalEventSortField) => void;
  onEditPeriod: (row: HospitalEventRow) => void;
  onDuplicate: (row: HospitalEventRow) => void;
  onOpenConsultations: (row: HospitalEventRow) => void;
  onOpenDetail: (row: HospitalEventRow) => void;
  onGoPage: (page: number) => void;
};

export function HospitalEventsDataTable({
  rows,
  meta,
  loading,
  refreshing,
  error,
  highlightedRowId,
  sortState,
  canDuplicate,
  canEditPeriod,
  onToggleSort,
  onEditPeriod,
  onDuplicate,
  onOpenConsultations,
  onOpenDetail,
  onGoPage,
}: HospitalEventsDataTableProps) {
  const columns = React.useMemo(
    () =>
      buildHospitalEventColumns({
        sortState,
        canDuplicate,
        canEditPeriod,
        onToggleSort,
        onEditPeriod,
        onDuplicate,
        onOpenConsultations,
      }),
    [sortState, canDuplicate, canEditPeriod, onToggleSort, onEditPeriod, onDuplicate, onOpenConsultations],
  );
  const getRowClassName = React.useCallback(
    (row: HospitalEventRow) =>
      [
        pendingReviewAllowStatusRowClass(row.allowStatus),
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
      loadingLabel="이벤트 목록 불러오는 중"
      getRowClassName={getRowClassName}
      loading={loading}
      refreshing={refreshing}
      error={error}
      meta={meta}

      onGoPage={onGoPage}
      onRowClick={onOpenDetail}
    />
  );
}
