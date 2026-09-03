"use client";

import { replaceCurrentPageUrl } from "@/lib/common/navigation/replaceCurrentPageUrl";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin";

import { AccountUsersDataTable } from "@/components/account-user/list/AccountUsersDataTable";
import { AccountUsersFilterPanel } from "@/components/account-user/list/AccountUsersFilterPanel";
import { AccountUsersSummaryCards } from "@/components/account-user/list/AccountUsersSummaryCards";
import { useListData } from "@/hooks/common/useListData";
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
  type AccountUserSummaryCardKey,
} from "@/lib/account-user/list";

function buildSummaryFilters(key: AccountUserSummaryCardKey): AccountUserFilters {
  const filters = {
    ...DEFAULT_ACCOUNT_USER_FILTERS,
    summaryFilter: key,
  };

  if (key === "withdrawn") {
    return {
      ...filters,
      status: "WITHDRAWN",
    };
  }

  if (key === "blocked") {
    return {
      ...filters,
      status: "BLOCKED",
    };
  }

  return {
    ...filters,
    warningCountMin: "1",
  };
}

export default function AccountUsersTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);
  const [initialTableState] = React.useState(() =>
    parseAccountUsersTableState(new URLSearchParams(searchParams.toString())),
  );

  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftFilters, setDraftFilters] = React.useState<AccountUserFilters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<AccountUserFilters>(initialTableState.filters);
  const [sortState, setSortState] = React.useState<AccountUserSortState>(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);
  const [summary, setSummary] = React.useState<AccountUserSummary | null>(null);

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
  const activeSummaryKey = appliedFilters.summaryFilter || null;

  const fetchAccountUserRows = React.useCallback(async (nextQuery: typeof query) => {
    const response = await api.get<AccountUserApiItem[]>("/users", nextQuery, {
      latestKey: "account-users:list",
    });

    if (!isApiSuccess(response)) {
      throw new Error(response.error.message || "일반회원 목록 조회에 실패했습니다.");
    }

    return {
      rows: response.data.map(normalizeAccountUser),
      meta: (response.meta as DataTableMeta | null) ?? null,
    };
  }, []);

  const { rows, meta, error, loading, refreshing } = useListData({
    cacheNamespace: "account-users",
    query,
    fetchRows: fetchAccountUserRows,
    errorMessage: "일반회원 목록 조회 중 오류가 발생했습니다.",
  });

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    replaceCurrentPageUrl(queryString ? `${pathname}?${queryString}` : pathname);
  }, [pathname, queryString, searchParams]);

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

  React.useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

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

  const applySummaryFilter = React.useCallback(
    (key: AccountUserSummaryCardKey) => {
      const nextFilters = activeSummaryKey === key ? DEFAULT_ACCOUNT_USER_FILTERS : buildSummaryFilters(key);

      setSearchInput("");
      setSearchKeyword("");
      setDraftDateRange(undefined);
      setDraftFilters(nextFilters);
      setAppliedFilters(nextFilters);
      setSortState(DEFAULT_ACCOUNT_USER_SORT);
      setIsDatePickerOpen(false);
      setPage(1);
    },
    [activeSummaryKey],
  );

  const applyDateRange = React.useCallback((nextRange?: DateRange) => {
    const mapped = mapDateRangeToAccountUserFilter(nextRange);

    setDraftDateRange(nextRange);
    setDraftFilters((prev) => ({
      ...prev,
      dateRange: mapped.label,
      startDate: mapped.startDate,
      endDate: mapped.endDate,
      summaryFilter: "",
    }));
  }, []);

  const applyDatePreset = React.useCallback(
    (preset: string) => {
      applyDateRange(buildAccountUserPresetDateRange(preset));
    },
    [applyDateRange],
  );

  const changeDraftFilter = React.useCallback(
    <K extends keyof AccountUserFilters>(key: K, value: AccountUserFilters[K]) => {
      setDraftFilters((prev) => ({
        ...prev,
        [key]: value,
        summaryFilter: "",
      }));
    },
    [],
  );

  const changeDateType = React.useCallback(
    (value: AccountUserDateType) => {
      changeDraftFilter("dateType", value);
    },
    [changeDraftFilter],
  );

  const changeWarningCount = React.useCallback(
    (key: "warningCountMin" | "warningCountMax", value: string) => {
      changeDraftFilter(key, value.replace(/[^\d]/g, ""));
    },
    [changeDraftFilter],
  );

  const toggleSort = React.useCallback((field: AccountUserSortField) => {
    setSortState((prev) => nextAccountUserSortState(prev, field));
    setPage(1);
  }, []);

  const openDetail = React.useCallback(
    (row: AccountUserRow) => {
      const currentQueryString = searchParams.toString();
      const returnTo = currentQueryString ? `${pathname}?${currentQueryString}` : pathname;

      router.push(`/user-manage/users/${row.id}?returnTo=${encodeURIComponent(returnTo)}`);
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="min-w-0 space-y-4">
      <AccountUsersSummaryCards summary={summary} activeKey={activeSummaryKey} onSelect={applySummaryFilter} />

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

      <AccountUsersDataTable
        rows={rows}
        meta={meta}
        loading={loading}
        refreshing={refreshing}
        error={error}
        sortState={sortState}
        onToggleSort={toggleSort}

        onGoPage={setPage}
        onOpenDetail={openDetail}
      />
    </div>
  );
}
