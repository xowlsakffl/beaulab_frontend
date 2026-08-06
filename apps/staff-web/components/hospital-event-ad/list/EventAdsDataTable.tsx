"use client";

import React from "react";
import Link from "next/link";
import {
  Button,
  CategoryBadgeList,
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
  eventAdAllowStatusColor,
  eventAdStatusColor,
  labelEventAdAllowStatus,
  labelEventAdStatus,
  type EventAdRow,
  type EventAdSortField,
  type EventAdSortState,
} from "@/lib/hospital-event-ad/list";
import { pendingReviewAllowStatusRowClass } from "@/lib/common/review-status";

function renderSortMark(field: EventAdSortField, sortState: EventAdSortState) {
  if (!sortState.enabled || sortState.field !== field) return <ChevronsUpDown className="size-4" />;

  return sortState.direction === "desc" ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />;
}

function DetailLink({
  href,
  title,
  children,
  className,
}: {
  href?: string | null;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const composedClassName = [
    "inline text-gray-800 underline decoration-gray-300 underline-offset-4 transition hover:text-brand-500 hover:decoration-brand-500",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (!href) {
    return (
      <span className={className} title={title}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={composedClassName}
      title={title}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      {children}
    </Link>
  );
}

function buildEventAdColumns({
  sortState,
  onToggleSort,
}: {
  sortState: EventAdSortState;
  onToggleSort: (field: EventAdSortField) => void;
}): DataTableColumn<EventAdRow>[] {
  const headerBaseClass = "px-2 py-3 text-left font-semibold text-theme-xs text-gray-600 ";
  const cellBaseClass = "px-2 py-4 text-start align-top ";
  const nowrapCellClass = `${cellBaseClass} overflow-hidden text-ellipsis whitespace-nowrap`;

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
      key: "requestedAt",
      headerClassName: `${headerBaseClass} lg:w-[132px]`,
      cellClassName: `${nowrapCellClass} lg:w-[132px]`,
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
      key: "placement",
      headerClassName: `${headerBaseClass} lg:w-[150px]`,
      cellClassName: `${cellBaseClass} lg:w-[150px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("placement")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          광고위치 <span className="text-xs text-gray-400">{renderSortMark("placement", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <div className="min-w-0">
          <span className="line-clamp-2 font-medium break-words text-gray-800" title={row.placementLabel}>
            {row.placementLabel}
          </span>
          {row.categoryLabel !== "-" ? (
            <div className="mt-1">
              <CategoryBadgeList values={[row.categoryLabel]} title={row.categoryLabel} />
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "cost",
      headerClassName: `${headerBaseClass} lg:w-[104px]`,
      cellClassName: `${nowrapCellClass} lg:w-[104px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("cost")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          비용 <span className="text-xs text-gray-400">{renderSortMark("cost", sortState)}</span>
        </Button>
      ),
      render: (row) => row.costLabel,
    },
    {
      key: "period",
      headerClassName: `${headerBaseClass} lg:w-[144px]`,
      cellClassName: `${cellBaseClass} lg:w-[144px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("start_at")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          광고기간 <span className="text-xs text-gray-400">{renderSortMark("start_at", sortState)}</span>
        </Button>
      ),
      render: (row) => <span className="whitespace-pre-line text-gray-700">{row.periodLabel}</span>,
    },
    {
      key: "hospital",
      headerClassName: `${headerBaseClass} lg:w-[136px]`,
      cellClassName: `${cellBaseClass} lg:w-[136px]`,
      header: "병의원",
      render: (row) => (
        <DetailLink
          href={row.hospitalId ? `/hospital-manage/hospitals/${row.hospitalId}` : null}
          title={row.hospitalName}
          className="line-clamp-2 font-medium break-words"
        >
          {row.hospitalName}
        </DetailLink>
      ),
    },
    {
      key: "event",
      headerClassName: `${headerBaseClass} lg:w-[220px]`,
      cellClassName: `${cellBaseClass} lg:w-[220px]`,
      header: "이벤트",
      render: (row) => (
        <div className="min-w-0">
          <DetailLink
            href={row.eventId ? `/ads-manage/events/${row.eventId}` : null}
            title={row.eventName}
            className="line-clamp-2 font-medium break-words"
          >
            {row.eventName}
          </DetailLink>
        </div>
      ),
    },
    {
      key: "allowStatus",
      headerClassName: `${headerBaseClass} lg:w-[86px]`,
      cellClassName: `${nowrapCellClass} lg:w-[86px]`,
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
        <StatusBadge size="sm" color={eventAdAllowStatusColor(row.allowStatus)}>
          {row.allowStatusLabel || labelEventAdAllowStatus(row.allowStatus)}
        </StatusBadge>
      ),
    },
    {
      key: "adStatus",
      headerClassName: `${headerBaseClass} lg:w-[86px]`,
      cellClassName: `${nowrapCellClass} lg:w-[86px]`,
      header: "광고상태",
      render: (row) =>
        row.adStatus ? (
          <StatusBadge size="sm" color={eventAdStatusColor(row.adStatus)}>
            {row.adStatusLabel || labelEventAdStatus(row.adStatus)}
          </StatusBadge>
        ) : (
          <span className="text-gray-500">-</span>
        ),
    },
    {
      key: "manager",
      headerClassName: `${headerBaseClass} lg:w-[92px]`,
      cellClassName: `${cellBaseClass} lg:w-[92px]`,
      header: "담당자",
      render: (row) => (
        <span className="line-clamp-2 break-words text-gray-700" title={row.managerName}>
          {row.managerName}
        </span>
      ),
    },
  ];
}

type EventAdsDataTableProps = {
  rows: EventAdRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  sortState: EventAdSortState;
  onToggleSort: (field: EventAdSortField) => void;
  onGoPage: (page: number) => void;
  onOpenDetail: (row: EventAdRow) => void;
};

export function EventAdsDataTable({
  rows,
  meta,
  loading,
  refreshing,
  error,
  sortState,
  onToggleSort,
  onGoPage,
  onOpenDetail,
}: EventAdsDataTableProps) {
  const columns = React.useMemo(() => buildEventAdColumns({ sortState, onToggleSort }), [sortState, onToggleSort]);

  return (
    <DataTable
      tableClassName="w-[1214px] min-w-[1214px] table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      getRowClassName={(row) => pendingReviewAllowStatusRowClass(row.allowStatus)}
      loadingVariant="spinner"
      loadingLabel="이벤트 광고 목록 불러오는 중"
      loading={loading}
      refreshing={refreshing}
      error={error}
      meta={meta}

      onGoPage={onGoPage}
      onRowClick={onOpenDetail}
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
      emptyText="조건에 맞는 이벤트 광고가 없습니다."
    />
  );
}
