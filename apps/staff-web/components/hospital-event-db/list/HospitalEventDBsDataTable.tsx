import React from "react";
import Link from "next/link";
import {
  Button,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  DataTable,
  Pagination,
  type DataTableColumn,
  type DataTableMeta,
  StatusValueBadge,
} from "@beaulab/ui-admin";

import {
  formatHospitalEventDBPrice,
  hospitalEventDBAllowStatusColor,
  hospitalEventDBStatusColor,
  type HospitalEventDBRow,
  type HospitalEventDBSortField,
  type HospitalEventDBSortState,
} from "@/lib/hospital-event-db/list";

type HospitalEventDBsDataTableProps = {
  rows: HospitalEventDBRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  sortState: HospitalEventDBSortState;
  onToggleSort: (field: HospitalEventDBSortField) => void;
  onGoPage: (page: number) => void;
};

function renderSortMark(field: HospitalEventDBSortField, sortState: HospitalEventDBSortState) {
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
  field: HospitalEventDBSortField;
  sortState: HospitalEventDBSortState;
  onToggleSort: (field: HospitalEventDBSortField) => void;
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
    <Link href={href} className={composedClassName} title={title}>
      {children}
    </Link>
  );
}

function buildColumns({
  sortState,
  onToggleSort,
}: {
  sortState: HospitalEventDBSortState;
  onToggleSort: (field: HospitalEventDBSortField) => void;
}): DataTableColumn<HospitalEventDBRow>[] {
  const headerBaseClass = "px-3 py-3 text-left font-semibold text-theme-xs text-gray-600 ";
  const cellBaseClass = "px-3 py-4 text-start align-top ";
  const nowrapCellClass = `${cellBaseClass} whitespace-nowrap`;

  return [
    {
      key: "id",
      headerClassName: `${headerBaseClass} w-[70px]`,
      cellClassName: `${nowrapCellClass} w-[70px]`,
      header: <SortHeader label="EDID" field="id" sortState={sortState} onToggleSort={onToggleSort} />,
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
      key: "hospital",
      headerClassName: `${headerBaseClass} w-[150px]`,
      cellClassName: `${cellBaseClass} w-[150px]`,
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
      headerClassName: `${headerBaseClass} w-[190px]`,
      cellClassName: `${cellBaseClass} w-[190px]`,
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
      key: "doctor",
      headerClassName: `${headerBaseClass} w-[120px]`,
      cellClassName: `${cellBaseClass} w-[120px]`,
      header: "의료진",
      render: (row) => (
        <DetailLink
          href={row.doctorId ? `/hospital-manage/doctors/${row.doctorId}` : null}
          title={row.doctorName}
          className="break-words"
        >
          {row.doctorName}
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
      key: "phone",
      headerClassName: `${headerBaseClass} w-[140px]`,
      cellClassName: `${nowrapCellClass} w-[140px]`,
      header: "전화번호",
      render: (row) => row.phone,
    },
    {
      key: "contactMethod",
      headerClassName: `${headerBaseClass} w-[90px]`,
      cellClassName: `${nowrapCellClass} w-[90px]`,
      header: "연락수단",
      render: (row) => row.contactMethodLabel,
    },
    {
      key: "preferredTime",
      headerClassName: `${headerBaseClass} w-[90px]`,
      cellClassName: `${nowrapCellClass} w-[90px]`,
      header: "선호시간",
      render: (row) => row.preferredTimeLabel,
    },
    {
      key: "eventPrice",
      headerClassName: `${headerBaseClass} w-[120px]`,
      cellClassName: `${nowrapCellClass} w-[120px]`,
      header: <SortHeader label="이벤트가격" field="event_price" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => formatHospitalEventDBPrice(row.eventPrice),
    },
    {
      key: "consultationPrice",
      headerClassName: `${headerBaseClass} w-[110px]`,
      cellClassName: `${nowrapCellClass} w-[110px]`,
      header: (
        <SortHeader label="소진단가" field="consultation_price" sortState={sortState} onToggleSort={onToggleSort} />
      ),
      render: (row) => formatHospitalEventDBPrice(row.consultationPrice),
    },
    {
      key: "status",
      headerClassName: `${headerBaseClass} w-[90px]`,
      cellClassName: `${nowrapCellClass} w-[90px]`,
      header: <SortHeader label="상담여부" field="status" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => <StatusValueBadge label={row.statusLabel} color={hospitalEventDBStatusColor(row.status)} />,
    },
    {
      key: "allowStatus",
      headerClassName: `${headerBaseClass} w-[130px]`,
      cellClassName: `${nowrapCellClass} w-[130px]`,
      header: <SortHeader label="검증상태" field="allow_status" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => (
        <StatusValueBadge label={row.allowStatusLabel} color={hospitalEventDBAllowStatusColor(row.allowStatus)} />
      ),
    },
  ];
}

export function HospitalEventDBsDataTable({
  rows,
  meta,
  loading,
  refreshing,
  error,
  sortState,
  onToggleSort,
  onGoPage,
}: HospitalEventDBsDataTableProps) {
  const columns = React.useMemo(() => buildColumns({ sortState, onToggleSort }), [sortState, onToggleSort]);

  return (
    <DataTable
      tableClassName="w-[1560px] min-w-[1560px] table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      loadingVariant="spinner"
      loadingLabel="이벤트 DB 목록 불러오는 중"
      loading={loading}
      refreshing={refreshing}
      error={error}
      meta={meta}

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
