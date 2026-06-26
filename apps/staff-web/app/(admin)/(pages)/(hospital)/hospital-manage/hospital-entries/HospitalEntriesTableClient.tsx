"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { HospitalEntriesDataTable } from "@/components/hospital-entry/list/HospitalEntriesDataTable";
import { HospitalEntriesFilterPanel } from "@/components/hospital-entry/list/HospitalEntriesFilterPanel";
import { HospitalEntriesSummaryCards } from "@/components/hospital-entry/list/HospitalEntriesSummaryCards";
import { api, isApiRequestCanceledError } from "@/lib/common/api";
import {
  DEFAULT_FILTERS,
  HOSPITAL_ENTRIES_PER_PAGE,
  buildHospitalEntriesQuery,
  buildHospitalEntriesQueryString,
  buildPresetDateRange,
  mapDateRangeToFilter,
  nextSortState,
  normalizeHospitalEntry,
  normalizeHospitalEntrySummary,
  parseHospitalEntriesTableState,
  type DateFilterKey,
  type DatePresetKey,
  type Filters,
  type HospitalEntryApiItem,
  type HospitalEntryRow,
  type HospitalEntrySummary,
  type HospitalEntrySummaryApiResponse,
  type SortField,
  type SortState,
} from "@/lib/hospital-entry/list";
import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin";

export default function HospitalEntriesTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTableStateRef = React.useRef<ReturnType<typeof parseHospitalEntriesTableState> | null>(null);

  if (!initialTableStateRef.current) {
    initialTableStateRef.current = parseHospitalEntriesTableState(new URLSearchParams(searchParams.toString()));
  }

  const initialTableState = initialTableStateRef.current;

  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [draftFilters, setDraftFilters] = React.useState<Filters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(initialTableState.filters);
  const [isAllowStatusDropdownOpen, setIsAllowStatusDropdownOpen] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const allowStatusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);

  const [sortState, setSortState] = React.useState<SortState>(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);

  const [rows, setRows] = React.useState<HospitalEntryRow[]>([]);
  const [summary, setSummary] = React.useState<HospitalEntrySummary | null>(null);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const requestKeyRef = React.useRef("");
  const hasFetchedRef = React.useRef(false);

  const query = React.useMemo(
    () =>
      buildHospitalEntriesQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        perPage: HOSPITAL_ENTRIES_PER_PAGE,
        page,
      }),
    [appliedFilters, page, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildHospitalEntriesQueryString(query), [query]);

  const buildReturnToPath = React.useCallback(() => {
    const rawQueryString = searchParams.toString();
    return rawQueryString ? `${pathname}?${rawQueryString}` : pathname;
  }, [pathname, searchParams]);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  const fetchSummary = React.useCallback(async () => {
    try {
      const response = await api.get<HospitalEntrySummaryApiResponse>("/hospital-entries/summary", undefined, {
        latestKey: "hospital-entries:summary",
      });

      if (!isApiSuccess(response)) {
        setSummary(null);
        return;
      }

      setSummary(normalizeHospitalEntrySummary(response.data));
    } catch (error) {
      if (isApiRequestCanceledError(error)) return;
      setSummary(null);
    }
  }, []);

  const fetchHospitalEntries = React.useCallback(
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
        const response = await api.get<HospitalEntryApiItem[]>("/hospital-entries", query, {
          latestKey: "hospital-entries:list",
        });
        if (!isApiSuccess(response)) {
          setError(response.error.message || "입점신청 목록 조회에 실패했습니다.");
          return;
        }

        const responseMeta = (response.meta as DataTableMeta | null) ?? null;
        setRows(response.data.map(normalizeHospitalEntry));
        setMeta(
          responseMeta
            ? {
                current_page: responseMeta.current_page,
                per_page: responseMeta.per_page,
                total: responseMeta.total,
                last_page: responseMeta.last_page,
              }
            : null,
        );
        hasFetchedRef.current = true;
      } catch (error) {
        if (isApiRequestCanceledError(error)) {
          shouldFinalize = false;
          return;
        }

        setError("입점신청 목록 조회 중 오류가 발생했습니다.");
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
    fetchHospitalEntries(false);
  }, [fetchHospitalEntries]);

  React.useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  React.useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!allowStatusDropdownRef.current?.contains(event.target as Node)) {
        setIsAllowStatusDropdownOpen(false);
      }

      if (!datePickerRef.current?.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const applyFilters = () => {
    setPage(1);
    setSearchKeyword(searchInput.trim());
    setAppliedFilters({
      allowStatuses: [...draftFilters.allowStatuses],
      dateRange: draftFilters.dateRange,
      startDate: draftFilters.startDate,
      endDate: draftFilters.endDate,
    });
  };

  const resetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setDraftDateRange(undefined);
    setSearchInput("");
    setSearchKeyword("");
    setIsAllowStatusDropdownOpen(false);
    setIsDatePickerOpen(false);
    setPage(1);
    setAppliedFilters(DEFAULT_FILTERS);
  };

  const toggleAllowStatus = (value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.allowStatuses.includes(value);
      return {
        ...prev,
        allowStatuses: exists
          ? prev.allowStatuses.filter((item) => item !== value)
          : [...prev.allowStatuses, value],
      };
    });
  };

  const toggleAllAllowStatus = () => {
    setDraftFilters((prev) => ({
      ...prev,
      allowStatuses:
        prev.allowStatuses.length === 3
          ? []
          : ["PENDING", "REJECTED", "APPROVED"],
    }));
  };

  const applyDateRange = (_key: DateFilterKey, nextRange?: DateRange) => {
    const mapped = mapDateRangeToFilter(nextRange);
    setDraftDateRange(nextRange);
    setDraftFilters((prev) => ({
      ...prev,
      dateRange: mapped.label,
      startDate: mapped.startDate,
      endDate: mapped.endDate,
    }));
  };

  const applyDatePreset = (key: DateFilterKey, preset: DatePresetKey) => {
    applyDateRange(key, buildPresetDateRange(preset));
  };

  const toggleSort = (field: SortField) => {
    setSortState((prev) => nextSortState(prev, field));
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <HospitalEntriesSummaryCards summary={summary} />
      <HospitalEntriesFilterPanel
        draftFilters={draftFilters}
        draftDateRange={draftDateRange}
        isAllowStatusDropdownOpen={isAllowStatusDropdownOpen}
        isDatePickerOpen={isDatePickerOpen}
        allowStatusDropdownRef={allowStatusDropdownRef}
        datePickerRef={datePickerRef}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onToggleAllowStatusDropdown={() => setIsAllowStatusDropdownOpen((prev) => !prev)}
        onToggleDatePicker={() => setIsDatePickerOpen((prev) => !prev)}
        onToggleAllowStatus={toggleAllowStatus}
        onToggleAllAllowStatus={toggleAllAllowStatus}
        onApplyDateRange={applyDateRange}
        onApplyDatePreset={applyDatePreset}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />
      <HospitalEntriesDataTable
        rows={rows}
        meta={meta}
        loading={loading}
        refreshing={refreshing}
        error={error}
        sortState={sortState}
        onToggleSort={toggleSort}
        onRefresh={() => {
          void fetchHospitalEntries(true);
          void fetchSummary();
        }}
        onGoPage={setPage}
        onRowClick={(row) => {
          const returnTo = buildReturnToPath();
          router.push(`/hospital-manage/hospital-entries/${row.id}?returnTo=${encodeURIComponent(returnTo)}`);
        }}
      />
    </div>
  );
}
