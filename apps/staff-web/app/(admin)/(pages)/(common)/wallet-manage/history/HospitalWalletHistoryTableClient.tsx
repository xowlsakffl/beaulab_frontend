"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { isApiSuccess } from "@beaulab/types";
import { Button, type DataTableMeta } from "@beaulab/ui-admin";

import { HospitalWalletHistoryDataTable } from "@/components/hospital-wallet/history/HospitalWalletHistoryDataTable";
import { HospitalWalletHistoryFilterPanel } from "@/components/hospital-wallet/history/HospitalWalletHistoryFilterPanel";
import { HospitalWalletRefundDocumentsModal } from "@/components/hospital-wallet/history/HospitalWalletRefundDocumentsModal";
import { HospitalWalletRefundStatusModal } from "@/components/hospital-wallet/history/HospitalWalletRefundStatusModal";
import { useListData } from "@/hooks/common/useListData";
import { api } from "@/lib/common/api";
import { getSession } from "@/lib/common/auth/session";
import {
  CHARGE_STATUS_OPTIONS,
  DEFAULT_WALLET_OPERATION_FILTERS,
  WALLET_OPERATION_TABS,
  buildWalletOperationPresetDateRange,
  buildWalletOperationsQuery,
  buildWalletOperationsQueryString,
  mapWalletOperationDateRange,
  nextWalletOperationSortState,
  normalizeWalletOperation,
  parseWalletOperationsTableState,
  type WalletOperationApiItem,
  type WalletOperationDatePresetKey,
  type WalletOperationFilters,
  type WalletOperationSortField,
  type WalletOperationStatus,
  type WalletOperationTypeGroup,
  type WalletOperationRow,
} from "@/lib/hospital-wallet/history";

function cloneFilters(filters: WalletOperationFilters): WalletOperationFilters {
  return { ...filters, statuses: [...filters.statuses] };
}

export default function HospitalWalletHistoryTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [initialState] = React.useState(() =>
    parseWalletOperationsTableState(new URLSearchParams(searchParams.toString())),
  );
  const [tab, setTab] = React.useState<WalletOperationTypeGroup>(initialState.tab);
  const [searchInput, setSearchInput] = React.useState(initialState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialState.searchKeyword);
  const [draftFilters, setDraftFilters] = React.useState<WalletOperationFilters>(initialState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<WalletOperationFilters>(initialState.filters);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialState.draftDateRange);
  const [sortState, setSortState] = React.useState(initialState.sortState);
  const [page, setPage] = React.useState(initialState.page);
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = React.useState(false);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);
  const statusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const [refundStatusRow, setRefundStatusRow] = React.useState<WalletOperationRow | null>(null);
  const [refundDocumentsRow, setRefundDocumentsRow] = React.useState<WalletOperationRow | null>(null);
  const permissions = getSession()?.auth?.permissions ?? [];
  const canProcessRefund = permissions.includes("beaulab.hospital_wallet.refund_process");
  const canManageRefundDocuments = permissions.includes("beaulab.hospital_wallet.refund_request") || canProcessRefund;

  const query = React.useMemo(
    () => buildWalletOperationsQuery({ tab, searchKeyword, filters: appliedFilters, sortState, page }),
    [appliedFilters, page, searchKeyword, sortState, tab],
  );
  const queryString = React.useMemo(() => buildWalletOperationsQueryString(query), [query]);

  const fetchRows = React.useCallback(async (nextQuery: typeof query) => {
    const response = await api.get<WalletOperationApiItem[]>("/hospital-wallet-operations", nextQuery, {
      latestKey: "hospital-wallet-operations:list",
    });

    if (!isApiSuccess(response)) {
      throw new Error(response.error.message || "충전금 내역 조회에 실패했습니다.");
    }

    return {
      rows: response.data.map(normalizeWalletOperation),
      meta: (response.meta as DataTableMeta | null) ?? null,
    };
  }, []);

  const { rows, meta, error, loading, refreshing, fetchList, resetList } = useListData({
    cacheNamespace: "hospital-wallet-operations",
    query,
    fetchRows,
    errorMessage: "충전금 내역 조회 중 오류가 발생했습니다.",
  });

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!datePickerRef.current?.contains(target)) setDatePickerOpen(false);
      if (!statusDropdownRef.current?.contains(target)) setStatusDropdownOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const applyFilters = React.useCallback(() => {
    setPage(1);
    setSearchKeyword(searchInput.trim());
    setAppliedFilters(cloneFilters(draftFilters));
  }, [draftFilters, searchInput]);

  const resetFilters = React.useCallback(() => {
    const defaults = cloneFilters(DEFAULT_WALLET_OPERATION_FILTERS);
    setPage(1);
    setSearchInput("");
    setSearchKeyword("");
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
    setDraftDateRange(undefined);
    setDatePickerOpen(false);
    setStatusDropdownOpen(false);
  }, []);

  const applyDateRange = React.useCallback((range?: DateRange) => {
    const normalizedRange = range?.from
      ? {
          from: new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate()),
          to: range.to ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate()) : undefined,
        }
      : undefined;
    setDraftDateRange(normalizedRange);
    setDraftFilters((current) => ({ ...current, ...mapWalletOperationDateRange(normalizedRange) }));
  }, []);

  const applyDatePreset = React.useCallback(
    (preset: WalletOperationDatePresetKey) => {
      applyDateRange(buildWalletOperationPresetDateRange(preset));
      setDatePickerOpen(false);
    },
    [applyDateRange],
  );

  const toggleStatus = React.useCallback((status: WalletOperationStatus) => {
    setDraftFilters((current) => ({
      ...current,
      statuses: current.statuses.includes(status)
        ? current.statuses.filter((value) => value !== status)
        : [...current.statuses, status],
    }));
  }, []);

  const toggleAllStatuses = React.useCallback(() => {
    setDraftFilters((current) => ({
      ...current,
      statuses:
        current.statuses.length === CHARGE_STATUS_OPTIONS.length
          ? []
          : CHARGE_STATUS_OPTIONS.map((option) => option.value),
    }));
  }, []);

  const changeTab = React.useCallback(
    (nextTab: WalletOperationTypeGroup) => {
      if (nextTab === tab) return;

      resetList();
      setPage(1);
      setTab(nextTab);
      setDatePickerOpen(false);
      setStatusDropdownOpen(false);
    },
    [resetList, tab],
  );

  const toggleSort = React.useCallback((field: WalletOperationSortField) => {
    setPage(1);
    setSortState((current) => nextWalletOperationSortState(current, field));
  }, []);

  const openRefundStatus = React.useCallback((row: WalletOperationRow) => {
    setRefundStatusRow(row);
  }, []);

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {WALLET_OPERATION_TABS.map((item) => (
          <Button
            key={item.value}
            type="button"
            variant={tab === item.value ? "brand" : "outline"}
            size="sm"
            onClick={() => changeTab(item.value)}
            className="h-10 min-w-[88px] px-5"
          >
            {item.label}
          </Button>
        ))}
      </div>

      <HospitalWalletHistoryFilterPanel
        tab={tab}
        searchInput={searchInput}
        draftFilters={draftFilters}
        draftDateRange={draftDateRange}
        datePickerOpen={datePickerOpen}
        statusDropdownOpen={statusDropdownOpen}
        datePickerRef={datePickerRef}
        statusDropdownRef={statusDropdownRef}
        onSearchChange={setSearchInput}
        onToggleDatePicker={() => {
          setStatusDropdownOpen(false);
          setDatePickerOpen((current) => !current);
        }}
        onToggleStatusDropdown={() => {
          setDatePickerOpen(false);
          setStatusDropdownOpen((current) => !current);
        }}
        onToggleStatus={toggleStatus}
        onToggleAllStatuses={toggleAllStatuses}
        onApplyDateRange={applyDateRange}
        onApplyDatePreset={applyDatePreset}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />

      <HospitalWalletHistoryDataTable
        tab={tab}
        rows={rows}
        meta={meta}
        loading={loading}
        refreshing={refreshing}
        error={error}
        sortState={sortState}
        onToggleSort={toggleSort}
        onGoPage={setPage}
        canProcessRefund={canProcessRefund}
        onOpenRefundStatus={openRefundStatus}
        onOpenRefundDocuments={setRefundDocumentsRow}
      />

      <HospitalWalletRefundDocumentsModal
        row={refundDocumentsRow}
        canManage={canManageRefundDocuments}
        onClose={() => setRefundDocumentsRow(null)}
        onUpdated={() => {
          setRefundDocumentsRow(null);
          void fetchList(true);
        }}
      />

      <HospitalWalletRefundStatusModal
        row={refundStatusRow}
        onClose={() => setRefundStatusRow(null)}
        onProcessed={() => {
          setRefundStatusRow(null);
          void fetchList(true);
        }}
      />
    </div>
  );
}
