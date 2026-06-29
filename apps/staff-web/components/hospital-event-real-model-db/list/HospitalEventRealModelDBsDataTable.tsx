"use client";

import React from "react";
import Link from "next/link";
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
  hospitalEventRealModelDBStatusColor,
  resolveHospitalEventRealModelDBMediaUrl,
  type HospitalEventRealModelDBRow,
  type HospitalEventRealModelDBSortField,
  type HospitalEventRealModelDBSortState,
} from "@/lib/hospital-event-real-model-db/list";

type HospitalEventRealModelDBsDataTableProps = {
  rows: HospitalEventRealModelDBRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  sortState: HospitalEventRealModelDBSortState;
  onToggleSort: (field: HospitalEventRealModelDBSortField) => void;
  onRefresh: () => void;
  onGoPage: (page: number) => void;
  onOpenDetail: (row: HospitalEventRealModelDBRow) => void;
};

function renderSortMark(field: HospitalEventRealModelDBSortField, sortState: HospitalEventRealModelDBSortState) {
  if (!sortState.enabled || sortState.field !== field) return <ChevronsUpDown className="size-4" />;

  return sortState.direction === "desc" ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />;
}

function SortHeader({
  label,
  field,
  sortState,
  onToggleSort,
}: {
  label: string;
  field: HospitalEventRealModelDBSortField;
  sortState: HospitalEventRealModelDBSortState;
  onToggleSort: (field: HospitalEventRealModelDBSortField) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onToggleSort(field)}
      className="inline-flex items-center gap-1 px-0 text-xs"
    >
      {label} <span className="text-xs text-gray-400">{renderSortMark(field, sortState)}</span>
    </Button>
  );
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
    <Link href={href} className={composedClassName} title={title} onClick={(event) => event.stopPropagation()}>
      {children}
    </Link>
  );
}

function renderImagePreview(row: HospitalEventRealModelDBRow) {
  const imageUrl = resolveHospitalEventRealModelDBMediaUrl(row.firstImage, "thumb");
  const imageFrameClass = "h-[100px] w-full min-w-[84px] max-w-[100px] shrink-0";

  if (!imageUrl) {
    return (
      <div
        className={`${imageFrameClass} flex items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400`}
      >
        {row.imageCount > 0 ? `${row.imageCount}+` : "-"}
      </div>
    );
  }

  return (
    <div className={`${imageFrameClass} relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- image domains come from runtime API/storage configuration */}
      <img
        src={imageUrl}
        alt={`리얼모델 신청 ${row.id} 이미지`}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
      {row.imageCount > 0 ? (
        <span className="absolute right-0 bottom-0 rounded-tl-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white">
          {row.imageCount}+
        </span>
      ) : null}
    </div>
  );
}

function buildColumns({
  sortState,
  onToggleSort,
}: {
  sortState: HospitalEventRealModelDBSortState;
  onToggleSort: (field: HospitalEventRealModelDBSortField) => void;
}): DataTableColumn<HospitalEventRealModelDBRow>[] {
  const headerBaseClass = "px-3 py-3 text-left font-semibold text-theme-xs text-gray-600 ";
  const cellBaseClass = "px-3 py-4 text-start align-top ";
  const nowrapCellClass = `${cellBaseClass} whitespace-nowrap`;

  return [
    {
      key: "id",
      headerClassName: `${headerBaseClass} w-[72px]`,
      cellClassName: `${nowrapCellClass} w-[72px]`,
      header: <SortHeader label="RDID" field="id" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.id,
    },
    {
      key: "createdAt",
      headerClassName: `${headerBaseClass} w-[150px]`,
      cellClassName: `${nowrapCellClass} w-[150px]`,
      header: <SortHeader label="신청일" field="created_at" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.createdAt,
    },
    {
      key: "image",
      headerClassName: `${headerBaseClass} w-[120px]`,
      cellClassName: `${cellBaseClass} w-[120px]`,
      header: "이미지",
      render: renderImagePreview,
    },
    {
      key: "hospital",
      headerClassName: `${headerBaseClass} w-[160px]`,
      cellClassName: `${cellBaseClass} w-[160px]`,
      header: "병의원",
      render: (row) => (
        <DetailLink
          href={row.hospitalId ? `/hospital-manage/hospitals/${row.hospitalId}` : null}
          title={row.hospitalName}
          className="font-medium break-words"
        >
          {row.hospitalName}
        </DetailLink>
      ),
    },
    {
      key: "event",
      headerClassName: `${headerBaseClass} w-[200px]`,
      cellClassName: `${cellBaseClass} w-[200px]`,
      header: "이벤트",
      render: (row) => (
        <DetailLink
          href={row.eventId ? `/ads-manage/events/${row.eventId}` : null}
          title={row.eventName}
          className="break-words"
        >
          {row.eventName}
        </DetailLink>
      ),
    },
    {
      key: "name",
      headerClassName: `${headerBaseClass} w-[110px]`,
      cellClassName: `${cellBaseClass} w-[110px]`,
      header: "이름",
      render: (row) => (
        <DetailLink
          href={row.accountUserId ? `/user-manage/users/${row.accountUserId}` : null}
          title={row.applicantName}
          className="block font-medium break-words"
        >
          {row.applicantName}
        </DetailLink>
      ),
    },
    {
      key: "gender",
      headerClassName: `${headerBaseClass} w-[82px]`,
      cellClassName: `${nowrapCellClass} w-[82px]`,
      header: <SortHeader label="성별" field="gender" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.genderLabel,
    },
    {
      key: "birthDate",
      headerClassName: `${headerBaseClass} w-[120px]`,
      cellClassName: `${nowrapCellClass} w-[120px]`,
      header: <SortHeader label="생년월일" field="birth_date" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.birthDate,
    },
    {
      key: "phone",
      headerClassName: `${headerBaseClass} w-[140px]`,
      cellClassName: `${nowrapCellClass} w-[140px]`,
      header: "전화번호",
      render: (row) => row.phone,
    },
    {
      key: "status",
      headerClassName: `${headerBaseClass} w-[100px]`,
      cellClassName: `${nowrapCellClass} w-[100px]`,
      header: <SortHeader label="승인여부" field="status" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => (
        <StatusBadge size="sm" color={hospitalEventRealModelDBStatusColor(row.status)}>
          {row.statusLabel}
        </StatusBadge>
      ),
    },
  ];
}

export function HospitalEventRealModelDBsDataTable({
  rows,
  meta,
  loading,
  refreshing,
  error,
  sortState,
  onToggleSort,
  onRefresh,
  onGoPage,
  onOpenDetail,
}: HospitalEventRealModelDBsDataTableProps) {
  const columns = React.useMemo(() => buildColumns({ sortState, onToggleSort }), [sortState, onToggleSort]);

  return (
    <DataTable
      tableClassName="w-[1254px] min-w-[1254px] table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      loadingVariant="spinner"
      loadingLabel="리얼모델 신청 목록 불러오는 중"
      loading={loading}
      refreshing={refreshing}
      error={error}
      meta={meta}
      onRowClick={onOpenDetail}
      onRefresh={onRefresh}
      refreshPlacement="left"
      onGoPage={onGoPage}
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
    />
  );
}
