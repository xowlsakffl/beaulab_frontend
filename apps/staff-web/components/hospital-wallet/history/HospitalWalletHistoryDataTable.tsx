"use client";

import Link from "next/link";
import React from "react";
import {
  DataTable,
  DataTableSortHeader,
  FormCheckbox,
  Pagination,
  Spinner,
  type DataTableColumn,
  type DataTableMeta,
  StatusValueBadge,
} from "@beaulab/ui-admin";

import {
  formatWalletOperationPoint,
  walletOperationStatusColor,
  type WalletOperationRow,
  type WalletOperationSortField,
  type WalletOperationSortState,
  type WalletOperationTypeGroup,
} from "@/lib/hospital-wallet/history";

function SortHeader({
  field,
  label,
  sortState,
  onToggleSort,
}: {
  field: WalletOperationSortField;
  label: string;
  sortState: WalletOperationSortState;
  onToggleSort: (field: WalletOperationSortField) => void;
}) {
  return (
    <DataTableSortHeader
      label={label}
      active={sortState.field === field}
      direction={sortState.direction}
      onClick={() => onToggleSort(field)}
    />
  );
}

function HospitalLink({ row }: { row: WalletOperationRow }) {
  if (!row.hospitalId) return <span>{row.hospitalName}</span>;

  return (
    <Link
      href={`/hospital-manage/hospitals/${row.hospitalId}`}
      className="inline font-medium text-gray-800 underline decoration-gray-300 underline-offset-4 transition hover:text-brand-500 hover:decoration-brand-500"
      title={row.hospitalName}
    >
      {row.hospitalName}
    </Link>
  );
}

function statusColumn(
  header: string,
  canProcessRefund: boolean,
  onOpenRefundStatus: (row: WalletOperationRow) => void,
): DataTableColumn<WalletOperationRow> {
  return {
    key: "status",
    headerClassName: "w-28 px-2 py-3 text-left font-semibold text-theme-xs text-gray-600",
    cellClassName: "w-28 px-2 py-4 text-start align-top whitespace-nowrap",
    header,
    render: (row) => {
      if (row.type !== "CHARGE" && row.type !== "REFUND") return "-";

      const isRefundProcessable = row.type === "REFUND" && row.status === "PENDING" && canProcessRefund;
      const badge = (
        <StatusValueBadge
          label={row.statusLabel}
          color={walletOperationStatusColor(row.status)}
          className={isRefundProcessable ? "underline decoration-current underline-offset-2" : undefined}
        />
      );

      if (!isRefundProcessable) return badge;

      return (
        <button
          type="button"
          className="inline-flex cursor-pointer rounded-full border border-transparent transition-colors hover:border-blue-700"
          onClick={() => onOpenRefundStatus(row)}
          title="환불상태 변경"
        >
          {badge}
        </button>
      );
    },
  };
}

function buildColumns({
  tab,
  sortState,
  onToggleSort,
  canProcessRefund,
  canViewRefundDocuments,
  onOpenRefundStatus,
  onOpenRefundDocuments,
}: {
  tab: WalletOperationTypeGroup;
  sortState: WalletOperationSortState;
  onToggleSort: (field: WalletOperationSortField) => void;
  canProcessRefund: boolean;
  canViewRefundDocuments: boolean;
  onOpenRefundStatus: (row: WalletOperationRow) => void;
  onOpenRefundDocuments: (row: WalletOperationRow) => void;
}): DataTableColumn<WalletOperationRow>[] {
  const headerClass = "px-2 py-3 text-left font-semibold text-theme-xs text-gray-600";
  const cellClass = "px-2 py-4 text-start align-top";
  const nowrapCellClass = `${cellClass} overflow-hidden text-ellipsis whitespace-nowrap`;
  const columns: DataTableColumn<WalletOperationRow>[] = [
    {
      key: "id",
      headerClassName: `${headerClass} w-20`,
      cellClassName: `${nowrapCellClass} w-20`,
      header: <SortHeader field="id" label="ID" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.id,
    },
    {
      key: "createdAt",
      headerClassName: `${headerClass} w-44`,
      cellClassName: `${nowrapCellClass} w-44 tabular-nums`,
      header: (
        <SortHeader
          field="created_at"
          label={tab === "REFUND" ? "요청일" : "거래일"}
          sortState={sortState}
          onToggleSort={onToggleSort}
        />
      ),
      render: (row) => row.createdAt,
    },
    {
      key: "hospital",
      headerClassName: `${headerClass} w-72`,
      cellClassName: `${cellClass} w-72`,
      header: "병의원",
      render: (row) => (
        <span className="line-clamp-2 block break-words" title={row.hospitalName}>
          <HospitalLink row={row} />
        </span>
      ),
    },
    {
      key: "type",
      headerClassName: `${headerClass} w-36`,
      cellClassName: `${nowrapCellClass} w-36`,
      header: "구분",
      render: (row) => row.typeLabel,
    },
    {
      key: "amount",
      headerClassName: `${headerClass} w-40`,
      cellClassName: `${nowrapCellClass} w-40 font-semibold tabular-nums`,
      header: <SortHeader field="amount" label="포인트" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => (
        <span className={row.signedAmount >= 0 ? "text-success-600" : "text-error-600"}>
          {formatWalletOperationPoint(row.signedAmount)}
        </span>
      ),
    },
  ];

  if (tab === "USAGE") {
    columns.push({
      key: "reference",
      headerClassName: `${headerClass} w-52`,
      cellClassName: `${cellClass} w-52`,
      header: "결제대상",
      render: (row) => (
        <span className="line-clamp-2 break-words text-gray-700" title={row.referenceLabel}>
          {row.referenceLabel}
        </span>
      ),
    });
  }

  if (tab === "SERVICE") {
    columns.push({
      key: "reason",
      headerClassName: `${headerClass} w-56`,
      cellClassName: `${cellClass} w-56`,
      header: "사유",
      render: (row) => (
        <span className="line-clamp-1 break-words text-gray-700" title={row.reason}>
          {row.reason}
        </span>
      ),
    });
  }

  if (tab === "REFUND") {
    columns.push({
      key: "documents",
      headerClassName: `${headerClass} w-28`,
      cellClassName: `${cellClass} w-28`,
      header: "첨부서류",
      render: (row) => (
        <span
          className="inline-flex items-center gap-2"
          title={`사업자등록증 ${row.hasBusinessRegistrationFile ? "등록" : "미등록"} / 통장 사본 ${row.hasBankbookFile ? "등록" : "미등록"}`}
        >
          <FormCheckbox
            checked={row.hasBusinessRegistrationFile}
            disabled={!canViewRefundDocuments}
            onChange={() => {
              if (canViewRefundDocuments) onOpenRefundDocuments(row);
            }}
            ariaLabel="사업자등록증 등록 여부"
          />
          <FormCheckbox
            checked={row.hasBankbookFile}
            disabled={!canViewRefundDocuments}
            onChange={() => {
              if (canViewRefundDocuments) onOpenRefundDocuments(row);
            }}
            ariaLabel="통장 사본 등록 여부"
          />
        </span>
      ),
    });
    columns.push({
      key: "reason",
      headerClassName: `${headerClass} w-56`,
      cellClassName: `${cellClass} w-56`,
      header: "환불사유",
      render: (row) => (
        <span className="line-clamp-1 break-words text-gray-700" title={row.reason}>
          {row.reason}
        </span>
      ),
    });
  }

  if (tab === "CHARGE" || tab === "REFUND" || tab === "ALL") {
    const statusHeader = tab === "CHARGE" ? "입금상태" : tab === "REFUND" ? "환불상태" : "상태";
    columns.push(statusColumn(statusHeader, canProcessRefund, onOpenRefundStatus));
  }

  columns.push({
    key: "actor",
    headerClassName: `${headerClass} w-32`,
    cellClassName: `${cellClass} w-32`,
    header: "관리자",
    render: (row) => (
      <span className="line-clamp-2 break-words text-gray-700" title={row.actorLabel}>
        {row.actorLabel}
      </span>
    ),
  });

  return columns;
}

export function HospitalWalletHistoryDataTable({
  tab,
  rows,
  meta,
  loading,
  refreshing,
  error,
  sortState,
  onToggleSort,
  onGoPage,
  canProcessRefund,
  canViewRefundDocuments,
  onOpenRefundStatus,
  onOpenRefundDocuments,
}: {
  tab: WalletOperationTypeGroup;
  rows: WalletOperationRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  sortState: WalletOperationSortState;
  onToggleSort: (field: WalletOperationSortField) => void;
  onGoPage: (page: number) => void;
  canProcessRefund: boolean;
  canViewRefundDocuments: boolean;
  onOpenRefundStatus: (row: WalletOperationRow) => void;
  onOpenRefundDocuments: (row: WalletOperationRow) => void;
}) {
  const columns = React.useMemo(
    () =>
      buildColumns({
        tab,
        sortState,
        onToggleSort,
        canProcessRefund,
        canViewRefundDocuments,
        onOpenRefundStatus,
        onOpenRefundDocuments,
      }),
    [canProcessRefund, canViewRefundDocuments, onOpenRefundDocuments, onOpenRefundStatus, onToggleSort, sortState, tab],
  );
  const tableClassName =
    tab === "REFUND"
      ? "w-[1400px] min-w-[1400px] table-fixed"
      : tab === "SERVICE"
        ? "w-[1200px] min-w-[1200px] table-fixed"
        : tab === "USAGE"
          ? "w-[1184px] min-w-[1184px] table-fixed"
          : "w-[1088px] min-w-[1088px] table-fixed";

  if (loading || refreshing) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-gray-200 bg-white">
        <Spinner className="size-8 text-brand-500" label="충전금 내역 불러오는 중" />
      </div>
    );
  }

  return (
    <DataTable
      tableClassName={tableClassName}
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      loadingVariant="spinner"
      loadingLabel="충전금 내역 불러오는 중"
      loading={false}
      refreshing={false}
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
      emptyText="조건에 맞는 충전금 내역이 없습니다."
    />
  );
}
