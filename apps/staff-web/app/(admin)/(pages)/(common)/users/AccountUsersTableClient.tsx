"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin";

import { AccountUsersDataTable } from "@/components/account-user/list/AccountUsersDataTable";
import { AccountUsersFilterPanel } from "@/components/account-user/list/AccountUsersFilterPanel";
import {
  AccountUsersSignupChannelCard,
  AccountUsersSummaryCards,
} from "@/components/account-user/list/AccountUsersSummaryCards";
import { api, isApiRequestCanceledError } from "@/lib/common/api";
import {
  DEFAULT_ACCOUNT_USER_FILTERS,
  DEFAULT_ACCOUNT_USER_SORT,
  buildAccountUserPresetDateRange,
  buildAccountUsersQuery,
  buildAccountUsersQueryString,
  mapDateRangeToAccountUserFilter,
  nextAccountUserSortState,
  normalizeAccountUser,
  parseAccountUsersTableState,
  type AccountUserApiItem,
  type AccountUserDateType,
  type AccountUserFilters,
  type AccountUserRow,
  type AccountUserSortField,
  type AccountUserSortState,
  type AccountUserSummary,
} from "@/lib/account-user/list";

export default function AccountUsersTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTableStateRef = React.useRef<ReturnType<typeof parseAccountUsersTableState> | null>(null);
  const requestKeyRef = React.useRef("");
  const hasFetchedRef = React.useRef(false);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);

  if (!initialTableStateRef.current) {
    initialTableStateRef.current = parseAccountUsersTableState(new URLSearchParams(searchParams.toString()));
  }

  const initialTableState = initialTableStateRef.current;
  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftFilters, setDraftFilters] = React.useState<AccountUserFilters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<AccountUserFilters>(initialTableState.filters);
  const [sortState, setSortState] = React.useState<AccountUserSortState>(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);
  const [rows, setRows] = React.useState<AccountUserRow[]>([]);
  const [summary, setSummary] = React.useState<AccountUserSummary | null>(null);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const query = React.useMemo(
    () =>
      buildAccountUsersQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        page,
      }),
    [appliedFilters, page, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildAccountUsersQueryString(query), [query]);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  const fetchSummary = React.useCallback(async () => {
    try {
      const response = await api.get<AccountUserSummary>("/users/summary", undefined, {
        latestKey: "account-users:summary",
      });

      if (!isApiSuccess(response)) {
        return;
      }

      setSummary(response.data);
    } catch (error) {
      if (isApiRequestCanceledError(error)) return;

      setSummary(null);
    }
  }, []);

  const fetchUsers = React.useCallback(
    async (manualRefresh = false) => {
      const requestKey = JSON.stringify(query);
      if (!manualRefresh && requestKeyRef.current === requestKey) return;
      requestKeyRef.current = requestKey;

      if (!hasFetchedRef.current) setLoading(true);
      else setRefreshing(true);
      if (manualRefresh) setRefreshing(true);

      setError(null);
      let shouldFinalize = true;

      try {
        const response = await api.get<AccountUserApiItem[]>("/users", query, {
          latestKey: "account-users:list",
        });

        if (!isApiSuccess(response)) {
          setError(response.error.message || "일반회원 목록 조회에 실패했습니다.");
          return;
        }

        setRows(response.data.map(normalizeAccountUser));
        setMeta((response.meta as DataTableMeta | null) ?? null);
        hasFetchedRef.current = true;
      } catch (error) {
        if (isApiRequestCanceledError(error)) {
          shouldFinalize = false;
          return;
        }

        setError("일반회원 목록 조회 중 오류가 발생했습니다.");
      } finally {
        if (shouldFinalize) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [query],
  );

  React.useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  React.useEffect(() => {
    void fetchUsers(false);
  }, [fetchUsers]);

  React.useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!datePickerRef.current?.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const applyFilters = React.useCallback(() => {
    setSearchKeyword(searchInput.trim());
    setAppliedFilters(draftFilters);
    setPage(1);
  }, [draftFilters, searchInput]);

  const resetFilters = React.useCallback(() => {
    setSearchInput("");
    setSearchKeyword("");
    setDraftDateRange(undefined);
    setDraftFilters(DEFAULT_ACCOUNT_USER_FILTERS);
    setAppliedFilters(DEFAULT_ACCOUNT_USER_FILTERS);
    setSortState(DEFAULT_ACCOUNT_USER_SORT);
    setIsDatePickerOpen(false);
    setPage(1);
  }, []);

  const applyDateRange = React.useCallback((nextRange?: DateRange) => {
    const mapped = mapDateRangeToAccountUserFilter(nextRange);

    setDraftDateRange(nextRange);
    setDraftFilters((prev) => ({
      ...prev,
      dateRange: mapped.label,
      startDate: mapped.startDate,
      endDate: mapped.endDate,
    }));
  }, []);

  const applyDatePreset = React.useCallback((preset: string) => {
    applyDateRange(buildAccountUserPresetDateRange(preset));
  }, [applyDateRange]);

  const changeDraftFilter = React.useCallback(<K extends keyof AccountUserFilters>(
    key: K,
    value: AccountUserFilters[K],
  ) => {
    setDraftFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const changeDateType = React.useCallback((value: AccountUserDateType) => {
    changeDraftFilter("dateType", value);
  }, [changeDraftFilter]);

  const changeWarningCount = React.useCallback((key: "warningCountMin" | "warningCountMax", value: string) => {
    changeDraftFilter(key, value.replace(/[^\d]/g, ""));
  }, [changeDraftFilter]);

  const toggleSort = React.useCallback((field: AccountUserSortField) => {
    setSortState((prev) => nextAccountUserSortState(prev, field));
    setPage(1);
  }, []);

  const refresh = React.useCallback(() => {
    void Promise.all([fetchSummary(), fetchUsers(true)]);
  }, [fetchSummary, fetchUsers]);

  const openDetail = React.useCallback((row: AccountUserRow) => {
    const currentQueryString = searchParams.toString();
    const returnTo = currentQueryString ? `${pathname}?${currentQueryString}` : pathname;

    router.push(`/users/${row.id}?returnTo=${encodeURIComponent(returnTo)}`);
  }, [pathname, router, searchParams]);

  return (
    <div className="min-w-0 space-y-4">
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0 space-y-4">
          <AccountUsersSummaryCards summary={summary} />

          <AccountUsersFilterPanel
            searchInput={searchInput}
            draftFilters={draftFilters}
            draftDateRange={draftDateRange}
            isDatePickerOpen={isDatePickerOpen}
            datePickerRef={datePickerRef}
            onSearchChange={setSearchInput}
            onDateTypeChange={changeDateType}
            onToggleDatePicker={() => setIsDatePickerOpen((prev) => !prev)}
            onApplyDateRange={applyDateRange}
            onApplyDatePreset={applyDatePreset}
            onSignupChannelChange={(value) => changeDraftFilter("signupChannel", value)}
            onStatusChange={(value) => changeDraftFilter("status", value)}
            onWarningCountMinChange={(value) => changeWarningCount("warningCountMin", value)}
            onWarningCountMaxChange={(value) => changeWarningCount("warningCountMax", value)}
            onApplyFilters={applyFilters}
            onResetFilters={resetFilters}
          />
        </div>

        <AccountUsersSignupChannelCard summary={summary} />
      </div>

      <AccountUsersDataTable
        rows={rows}
        meta={meta}
        loading={loading}
        refreshing={refreshing}
        error={error}
        sortState={sortState}
        onToggleSort={toggleSort}
        onRefresh={refresh}
        onGoPage={setPage}
        onOpenDetail={openDetail}
      />
    </div>
  );
}
