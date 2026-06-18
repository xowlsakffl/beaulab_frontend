"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin";

import { HospitalEventDBsDataTable } from "@/components/hospital-event-db/list/HospitalEventDBsDataTable";
import { HospitalEventDBsFilterPanel } from "@/components/hospital-event-db/list/HospitalEventDBsFilterPanel";
import { api, isApiRequestCanceledError } from "@/lib/common/api";
import {
  DEFAULT_HOSPITAL_EVENT_DB_FILTERS,
  buildHospitalEventDBPresetDateRange,
  buildHospitalEventDBsQuery,
  buildHospitalEventDBsQueryString,
  mapDateRangeToHospitalEventDBFilter,
  nextHospitalEventDBSortState,
  normalizeHospitalEventDB,
  normalizeNumberBound,
  normalizeRangeDate,
  parseHospitalEventDBsTableState,
  type HospitalEventDBAmountMetric,
  type HospitalEventDBApiItem,
  type HospitalEventDBDatePresetKey,
  type HospitalEventDBFilters,
  type HospitalEventDBRow,
  type HospitalEventDBSortField,
  type HospitalEventDBSortState,
} from "@/lib/hospital-event-db/list";

export default function HospitalEventDBsTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTableStateRef = React.useRef<ReturnType<typeof parseHospitalEventDBsTableState> | null>(null);
  const requestKeyRef = React.useRef("");
  const hasFetchedRef = React.useRef(false);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);

  if (!initialTableStateRef.current) {
    initialTableStateRef.current = parseHospitalEventDBsTableState(new URLSearchParams(searchParams.toString()));
  }

  const initialTableState = initialTableStateRef.current;
  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftFilters, setDraftFilters] = React.useState<HospitalEventDBFilters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<HospitalEventDBFilters>(initialTableState.filters);
  const [sortState, setSortState] = React.useState<HospitalEventDBSortState>(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);
  const [rows, setRows] = React.useState<HospitalEventDBRow[]>([]);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const query = React.useMemo(
    () =>
      buildHospitalEventDBsQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        page,
      }),
    [appliedFilters, page, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildHospitalEventDBsQueryString(query), [query]);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  const fetchEventDBs = React.useCallback(
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
        const response = await api.get<HospitalEventDBApiItem[]>("/hospital-event-dbs", query, {
          latestKey: "hospital-event-dbs:list",
        });

        if (!isApiSuccess(response)) {
          setError(response.error.message || "이벤트 DB 목록 조회에 실패했습니다.");
          return;
        }

        setRows(response.data.map(normalizeHospitalEventDB));
        setMeta((response.meta as DataTableMeta | null) ?? null);
        hasFetchedRef.current = true;
      } catch (error) {
        if (isApiRequestCanceledError(error)) {
          shouldFinalize = false;
          return;
        }

        setError("이벤트 DB 목록 조회 중 오류가 발생했습니다.");
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
    void fetchEventDBs(false);
  }, [fetchEventDBs]);

  React.useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!datePickerRef.current?.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const applyDateRange = (nextRange?: DateRange) => {
    const normalizedRange =
      nextRange?.from || nextRange?.to
        ? {
            from: nextRange?.from ? normalizeRangeDate(nextRange.from) : undefined,
            to: nextRange?.to ? normalizeRangeDate(nextRange.to) : undefined,
          }
        : undefined;
    const mapped = mapDateRangeToHospitalEventDBFilter(normalizedRange);

    setDraftDateRange(normalizedRange);
    setDraftFilters((prev) => ({
      ...prev,
      dateRange: mapped.label,
      startDate: mapped.startDate,
      endDate: mapped.endDate,
    }));
  };

  const applyDatePreset = (preset: HospitalEventDBDatePresetKey) => {
    applyDateRange(buildHospitalEventDBPresetDateRange(preset));
    setIsDatePickerOpen(false);
  };

  const applyFilters = () => {
    setPage(1);
    setSearchKeyword(searchInput.trim());
    setAppliedFilters({
      ...draftFilters,
      amountMin: normalizeNumberBound(draftFilters.amountMin),
      amountMax: normalizeNumberBound(draftFilters.amountMax),
    });
  };

  const resetFilters = () => {
    setDraftFilters(DEFAULT_HOSPITAL_EVENT_DB_FILTERS);
    setAppliedFilters(DEFAULT_HOSPITAL_EVENT_DB_FILTERS);
    setDraftDateRange(undefined);
    setSearchInput("");
    setSearchKeyword("");
    setPage(1);
    setIsDatePickerOpen(false);
  };

  const toggleSort = React.useCallback((field: HospitalEventDBSortField) => {
    setPage(1);
    setSortState((prev) => nextHospitalEventDBSortState(prev, field));
  }, []);

  return (
    <div className="min-w-0 space-y-4">
      <HospitalEventDBsFilterPanel
        searchInput={searchInput}
        draftFilters={draftFilters}
        draftDateRange={draftDateRange}
        isDatePickerOpen={isDatePickerOpen}
        datePickerRef={datePickerRef}
        onSearchChange={setSearchInput}
        onToggleDatePicker={() => setIsDatePickerOpen((prev) => !prev)}
        onApplyDateRange={applyDateRange}
        onApplyDatePreset={applyDatePreset}
        onContactMethodChange={(value) => setDraftFilters((prev) => ({ ...prev, contactMethod: value }))}
        onPreferredTimeChange={(value) => setDraftFilters((prev) => ({ ...prev, preferredTime: value }))}
        onAmountMetricChange={(value: HospitalEventDBAmountMetric) => setDraftFilters((prev) => ({ ...prev, amountMetric: value }))}
        onAmountMinChange={(value) => setDraftFilters((prev) => ({ ...prev, amountMin: value }))}
        onAmountMaxChange={(value) => setDraftFilters((prev) => ({ ...prev, amountMax: value }))}
        onStatusChange={(value) => setDraftFilters((prev) => ({ ...prev, status: value }))}
        onAllowStatusChange={(value) => setDraftFilters((prev) => ({ ...prev, allowStatus: value }))}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />

      <HospitalEventDBsDataTable
        rows={rows}
        meta={meta}
        loading={loading}
        refreshing={refreshing}
        error={error}
        sortState={sortState}
        onToggleSort={toggleSort}
        onRefresh={() => void fetchEventDBs(true)}
        onGoPage={setPage}
      />
    </div>
  );
}
