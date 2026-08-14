"use client";

import React from "react";

import { Can } from "@/components/common/guard";
import {
  Button,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  DataTable,
  FormCheckbox,
  Pagination,
  type DataTableColumn,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import {
  formatPoint,
  type HospitalWalletBalanceChange,
  type HospitalWalletRow,
  type HospitalWalletServicePointMode,
  type SortField,
  type SortState,
} from "@/lib/hospital-wallet/list";

function renderSortMark(field: SortField, sortState: SortState) {
  if (sortState.field !== field) return <ChevronsUpDown className="size-4" />;
  return sortState.direction === "desc" ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />;
}

function SortHeader({
  field,
  label,
  sortState,
  onToggleSort,
}: {
  field: SortField;
  label: string;
  sortState: SortState;
  onToggleSort: (field: SortField) => void;
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

function SelectionCheckbox({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <span onClick={(event) => event.stopPropagation()}>
      <FormCheckbox ariaLabel={label} checked={checked} disabled={disabled} onChange={onChange} className="size-4" />
    </span>
  );
}

function buildColumns({
  sortState,
  selectedHospitalIds,
  allPageRowsSelected,
  controlsDisabled,
  recentChanges,
  onToggleSort,
  onToggleRow,
  onToggleAllRows,
}: {
  sortState: SortState;
  selectedHospitalIds: Set<number>;
  allPageRowsSelected: boolean;
  controlsDisabled: boolean;
  recentChanges: ReadonlyMap<number, HospitalWalletBalanceChange>;
  onToggleSort: (field: SortField) => void;
  onToggleRow: (hospitalId: number, checked: boolean) => void;
  onToggleAllRows: (checked: boolean) => void;
}): DataTableColumn<HospitalWalletRow>[] {
  const headerClass = "px-2 py-3 text-left font-semibold text-theme-xs text-gray-600";
  const cellClass = "px-2 py-4 text-start align-top";
  const nowrapCellClass = cellClass + " overflow-hidden text-ellipsis whitespace-nowrap";

  return [
    {
      key: "select",
      headerClassName: headerClass + " w-12",
      cellClassName: nowrapCellClass + " w-12",
      header: (
        <SelectionCheckbox
          label="현재 페이지 병의원 전체 선택"
          checked={allPageRowsSelected}
          disabled={controlsDisabled}
          onChange={onToggleAllRows}
        />
      ),
      render: (row) => (
        <SelectionCheckbox
          label={row.hospitalName + " 선택"}
          checked={selectedHospitalIds.has(row.hospitalId)}
          disabled={controlsDisabled || row.hospitalId <= 0}
          onChange={(checked) => onToggleRow(row.hospitalId, checked)}
        />
      ),
    },
    {
      key: "hospitalId",
      headerClassName: headerClass + " w-24",
      cellClassName: nowrapCellClass + " w-24",
      header: <SortHeader field="hospital_id" label="HID" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.hospitalId,
    },
    {
      key: "hospitalName",
      headerClassName: headerClass + " min-w-56",
      cellClassName: cellClass + " min-w-56",
      header: <SortHeader field="hospital_name" label="병의원" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => (
        <span className="line-clamp-2 block font-medium break-words text-gray-800" title={row.hospitalName}>
          {row.hospitalName}
        </span>
      ),
    },
    {
      key: "totalBalance",
      headerClassName: headerClass + " w-40",
      cellClassName: nowrapCellClass + " w-40 font-semibold text-gray-900 tabular-nums",
      header: (
        <SortHeader field="total_balance" label="전체 잔여 포인트" sortState={sortState} onToggleSort={onToggleSort} />
      ),
      render: (row) => formatPoint(row.totalBalance),
    },
    {
      key: "paidBalance",
      headerClassName: headerClass + " w-40",
      cellClassName: nowrapCellClass + " w-40 tabular-nums",
      header: (
        <SortHeader field="paid_balance" label="충전 잔여 포인트" sortState={sortState} onToggleSort={onToggleSort} />
      ),
      render: (row) => {
        const change = recentChanges.get(row.hospitalId);
        return (
          <div className="flex items-center gap-2">
            <span>{formatPoint(row.paidBalance)}</span>
            {change?.mode === "refund" ? (
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-error-500">
                <ArrowDown className="size-3.5" />-{formatPoint(change.amount)}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "serviceBalance",
      headerClassName: headerClass + " w-40",
      cellClassName: nowrapCellClass + " w-40 tabular-nums",
      header: (
        <SortHeader
          field="service_balance"
          label="서비스 잔여 포인트"
          sortState={sortState}
          onToggleSort={onToggleSort}
        />
      ),
      render: (row) => {
        const change = recentChanges.get(row.hospitalId);

        return (
          <div className="flex items-center gap-2">
            <span>{formatPoint(row.serviceBalance)}</span>
            {change && change.mode !== "refund" ? (
              <span
                className={
                  "inline-flex items-center gap-0.5 text-xs font-semibold " +
                  (change.mode === "grant" ? "text-success-600" : "text-error-500")
                }
              >
                {change.mode === "grant" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
                {change.mode === "grant" ? "+" : "-"}
                {formatPoint(change.amount)}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "activeEventCount",
      headerClassName: headerClass + " w-32",
      cellClassName: nowrapCellClass + " w-32 tabular-nums",
      header: (
        <SortHeader field="active_event_count" label="진행 이벤트" sortState={sortState} onToggleSort={onToggleSort} />
      ),
      render: (row) => row.activeEventCount.toLocaleString("ko-KR"),
    },
    {
      key: "activeAdCount",
      headerClassName: headerClass + " w-32",
      cellClassName: nowrapCellClass + " w-32 tabular-nums",
      header: (
        <SortHeader field="active_ad_count" label="진행 광고" sortState={sortState} onToggleSort={onToggleSort} />
      ),
      render: (row) => row.activeAdCount.toLocaleString("ko-KR"),
    },
  ];
}

type HospitalWalletsDataTableProps = {
  rows: HospitalWalletRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  sortState: SortState;
  selectedHospitalIds: Set<number>;
  recentChanges: ReadonlyMap<number, HospitalWalletBalanceChange>;
  submitting: boolean;
  onToggleSort: (field: SortField) => void;
  onToggleRow: (hospitalId: number, checked: boolean) => void;
  onToggleAllRows: (checked: boolean) => void;
  onOpenServicePointModal: (mode: HospitalWalletServicePointMode) => void;
  onOpenNoticeModal: () => void;
  onOpenRefundModal: () => void;
  directRefund: boolean;
  onGoPage: (page: number) => void;
};

export function HospitalWalletsDataTable({
  rows,
  meta,
  loading,
  refreshing,
  error,
  sortState,
  selectedHospitalIds,
  recentChanges,
  submitting,
  onToggleSort,
  onToggleRow,
  onToggleAllRows,
  onOpenServicePointModal,
  onOpenNoticeModal,
  onOpenRefundModal,
  directRefund,
  onGoPage,
}: HospitalWalletsDataTableProps) {
  const selectedCount = selectedHospitalIds.size;
  const selectableRows = React.useMemo(() => rows.filter((row) => row.hospitalId > 0), [rows]);
  const allPageRowsSelected =
    selectableRows.length > 0 && selectableRows.every((row) => selectedHospitalIds.has(row.hospitalId));
  const controlsDisabled = loading || refreshing || submitting;
  const columns = React.useMemo(
    () =>
      buildColumns({
        sortState,
        selectedHospitalIds,
        allPageRowsSelected,
        controlsDisabled,
        recentChanges,
        onToggleSort,
        onToggleRow,
        onToggleAllRows,
      }),
    [
      allPageRowsSelected,
      controlsDisabled,
      onToggleAllRows,
      onToggleRow,
      onToggleSort,
      recentChanges,
      selectedHospitalIds,
      sortState,
    ],
  );
  const getRowClassName = React.useCallback(
    (row: HospitalWalletRow) =>
      "transition-colors duration-500 " + (recentChanges.has(row.hospitalId) ? "bg-emerald-50/90" : ""),
    [recentChanges],
  );

  return (
    <DataTable
      tableClassName="w-[1120px] min-w-[1120px] table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      getRowClassName={getRowClassName}
      loadingVariant="spinner"
      loadingLabel="병의원 충전금 목록 불러오는 중"
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
      emptyText="조건에 맞는 병의원 충전금 정보가 없습니다."
      rightActions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Can permission="beaulab.hospital_wallet.service_grant">
            <Button
              type="button"
              variant="brand"
              size="sm"
              className="h-9 px-4"
              disabled={selectedCount === 0 || controlsDisabled}
              onClick={() => onOpenServicePointModal("grant")}
            >
              서비스 지급
            </Button>
          </Can>
          <Can permission="beaulab.hospital_wallet.service_reclaim">
            <Button
              type="button"
              variant="brandOutline"
              size="sm"
              className="h-9 px-4"
              disabled={selectedCount === 0 || controlsDisabled}
              onClick={() => onOpenServicePointModal("reclaim")}
            >
              서비스 회수
            </Button>
          </Can>
          <Can permission="beaulab.hospital_wallet.refund_request">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-4"
              disabled={selectedCount === 0 || controlsDisabled}
              onClick={onOpenRefundModal}
            >
              {directRefund ? "충전금 환불" : "충전금 환불 신청"}
            </Button>
          </Can>
          <Can permission="beaulab.hospital_wallet.notice_send">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-4"
              disabled={selectedCount === 0 || controlsDisabled}
              onClick={onOpenNoticeModal}
            >
              충전금 안내 발송
            </Button>
          </Can>
        </div>
      }
    />
  );
}
