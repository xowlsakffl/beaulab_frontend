"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin";

import { HospitalWalletNoticeModal } from "@/components/hospital-wallet/list/HospitalWalletNoticeModal";
import { HospitalWalletRefundModal } from "@/components/hospital-wallet/list/HospitalWalletRefundModal";
import { HospitalWalletServicePointModal } from "@/components/hospital-wallet/list/HospitalWalletServicePointModal";
import { HospitalWalletsDataTable } from "@/components/hospital-wallet/list/HospitalWalletsDataTable";
import { HospitalWalletsFilterPanel } from "@/components/hospital-wallet/list/HospitalWalletsFilterPanel";
import { useListData } from "@/hooks/common/useListData";
import { useHospitalWalletNoticeActions } from "@/hooks/hospital-wallet/useHospitalWalletNoticeActions";
import { useHospitalWalletRefundActions } from "@/hooks/hospital-wallet/useHospitalWalletRefundActions";
import { useHospitalWalletServicePointActions } from "@/hooks/hospital-wallet/useHospitalWalletServicePointActions";
import { api } from "@/lib/common/api";
import { getSession } from "@/lib/common/auth/session";
import {
  buildHospitalWalletsQuery,
  buildHospitalWalletsQueryString,
  nextSortState,
  normalizeHospitalWallet,
  parseHospitalWalletsTableState,
  type HospitalWalletApiItem,
  type HospitalWalletBalanceChange,
  type SortField,
} from "@/lib/hospital-wallet/list";
import { HOSPITAL_WALLET_PERMISSIONS } from "@/lib/hospital-wallet/permissions";

export default function HospitalWalletsTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [initialTableState] = React.useState(() =>
    parseHospitalWalletsTableState(new URLSearchParams(searchParams.toString())),
  );
  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [sortState, setSortState] = React.useState(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);
  const perPage = initialTableState.perPage;
  const [selectedHospitalIds, setSelectedHospitalIds] = React.useState<Set<number>>(new Set());
  const [recentChanges, setRecentChanges] = React.useState<Map<number, HospitalWalletBalanceChange>>(new Map());
  const canDirectRefund = getSession()?.auth?.permissions?.includes(HOSPITAL_WALLET_PERMISSIONS.refundProcess) ?? false;

  const query = React.useMemo(
    () => buildHospitalWalletsQuery({ searchKeyword, sortState, perPage, page }),
    [page, perPage, searchKeyword, sortState],
  );
  const queryString = React.useMemo(() => buildHospitalWalletsQueryString(query), [query]);
  const fetchHospitalWalletRows = React.useCallback(async (nextQuery: typeof query) => {
    const response = await api.get<HospitalWalletApiItem[]>("/hospital-wallets", nextQuery, {
      latestKey: "hospital-wallets:list",
    });

    if (!isApiSuccess(response)) {
      throw new Error(response.error.message || "병의원 충전금 목록 조회에 실패했습니다.");
    }

    const responseMeta = (response.meta as DataTableMeta | null) ?? null;

    return {
      rows: response.data.map(normalizeHospitalWallet),
      meta: responseMeta
        ? {
            current_page: responseMeta.current_page,
            per_page: responseMeta.per_page,
            total: responseMeta.total,
            last_page: responseMeta.last_page,
          }
        : null,
    };
  }, []);
  const {
    rows,
    setRows,
    meta,
    error,
    loading,
    refreshing,
    fetchList: fetchHospitalWallets,
  } = useListData({
    cacheNamespace: "hospital-wallets",
    query,
    fetchRows: fetchHospitalWalletRows,
    errorMessage: "병의원 충전금 목록 조회 중 오류가 발생했습니다.",
  });

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? pathname + "?" + queryString : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  React.useEffect(() => {
    if (recentChanges.size === 0) return;

    const timer = window.setTimeout(() => setRecentChanges(new Map()), 4000);
    return () => window.clearTimeout(timer);
  }, [recentChanges]);

  const selectedRows = React.useMemo(
    () => rows.filter((row) => selectedHospitalIds.has(row.hospitalId)),
    [rows, selectedHospitalIds],
  );
  const clearSelection = React.useCallback(() => setSelectedHospitalIds(new Set()), []);
  const refreshRows = React.useCallback(() => {
    void fetchHospitalWallets(true);
  }, [fetchHospitalWallets]);
  const servicePoint = useHospitalWalletServicePointActions({
    selectedHospitalIds,
    clearSelection,
    setRows,
    setRecentChanges,
    refreshRows,
  });
  const notice = useHospitalWalletNoticeActions({ selectedHospitalIds, clearSelection });
  const refund = useHospitalWalletRefundActions({
    selectedRows,
    selectedHospitalCount: selectedHospitalIds.size,
    clearSelection,
    setRows,
    setRecentChanges,
    refreshRows,
  });
  const submitting = servicePoint.submitting || notice.submitting || refund.submitting;

  const applyFilters = React.useCallback(() => {
    clearSelection();
    setRecentChanges(new Map());
    setPage(1);
    setSearchKeyword(searchInput.trim());
  }, [clearSelection, searchInput]);

  const resetFilters = React.useCallback(() => {
    clearSelection();
    setRecentChanges(new Map());
    setPage(1);
    setSearchInput("");
    setSearchKeyword("");
  }, [clearSelection]);

  const toggleRow = React.useCallback((hospitalId: number, checked: boolean) => {
    if (hospitalId <= 0) return;

    setSelectedHospitalIds((current) => {
      const next = new Set(current);
      if (checked) next.add(hospitalId);
      else next.delete(hospitalId);
      return next;
    });
  }, []);

  const toggleAllRows = React.useCallback(
    (checked: boolean) => {
      setSelectedHospitalIds(
        checked
          ? new Set(rows.filter((row) => row.hospitalId > 0 && !row.hospitalDeleted).map((row) => row.hospitalId))
          : new Set(),
      );
    },
    [rows],
  );

  return (
    <>
      <div className="space-y-4">
        <HospitalWalletsFilterPanel
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          onApplyFilters={applyFilters}
          onResetFilters={resetFilters}
        />

        <HospitalWalletsDataTable
          rows={rows}
          meta={meta}
          loading={loading}
          refreshing={refreshing}
          error={error}
          sortState={sortState}
          selectedHospitalIds={selectedHospitalIds}
          recentChanges={recentChanges}
          submitting={submitting}
          onToggleSort={(field: SortField) => {
            clearSelection();
            setRecentChanges(new Map());
            setPage(1);
            setSortState((current) => nextSortState(current, field));
          }}
          onToggleRow={toggleRow}
          onToggleAllRows={toggleAllRows}
          onOpenServicePointModal={servicePoint.open}
          onOpenNoticeModal={notice.open}
          onOpenRefundModal={refund.open}
          directRefund={canDirectRefund}
          onGoPage={(nextPage) => {
            clearSelection();
            setRecentChanges(new Map());
            setPage(nextPage);
          }}
        />
      </div>

      <HospitalWalletServicePointModal
        isOpen={servicePoint.mode !== null}
        mode={servicePoint.mode ?? "grant"}
        selectedRows={selectedRows}
        insufficientHospitals={servicePoint.insufficientHospitals}
        submitting={servicePoint.submitting}
        submitError={servicePoint.submitError}
        onClose={servicePoint.close}
        onSubmit={(amount, reason) => void servicePoint.submit(amount, reason)}
      />

      <HospitalWalletNoticeModal
        isOpen={notice.isOpen}
        selectedRows={selectedRows}
        submitting={notice.submitting}
        submitError={notice.submitError}
        onClose={notice.close}
        onSubmit={(payload) => void notice.submit(payload)}
      />

      <HospitalWalletRefundModal
        isOpen={refund.isOpen}
        hospital={selectedRows[0] ?? null}
        directProcess={canDirectRefund}
        submitting={refund.submitting}
        submitError={refund.submitError}
        onClose={refund.close}
        onSubmit={(payload) => void refund.submit(payload)}
      />
    </>
  );
}
