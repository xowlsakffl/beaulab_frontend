"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin";

import { HospitalEventRealModelDBsDataTable } from "@/components/hospital-event-real-model-db/list/HospitalEventRealModelDBsDataTable";
import { HospitalEventRealModelDBsFilterPanel } from "@/components/hospital-event-real-model-db/list/HospitalEventRealModelDBsFilterPanel";
import { api, isApiRequestCanceledError } from "@/lib/common/api";
import {
  DEFAULT_HOSPITAL_EVENT_REAL_MODEL_DB_FILTERS,
  buildHospitalEventRealModelDBPresetDateRange,
  buildHospitalEventRealModelDBsQuery,
  buildHospitalEventRealModelDBsQueryString,
  mapDateRangeToHospitalEventRealModelDBFilter,
  nextHospitalEventRealModelDBSortState,
  normalizeHospitalEventRealModelDB,
  normalizeRangeDate,
  parseHospitalEventRealModelDBsTableState,
  type HospitalEventRealModelDBApiItem,
  type HospitalEventRealModelDBDatePresetKey,
  type HospitalEventRealModelDBFilters,
  type HospitalEventRealModelDBRow,
  type HospitalEventRealModelDBSortField,
  type HospitalEventRealModelDBSortState,
} from "@/lib/hospital-event-real-model-db/list";

export default function HospitalEventRealModelDBsTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTableStateRef = React.useRef<ReturnType<typeof parseHospitalEventRealModelDBsTableState> | null>(null);
  const requestKeyRef = React.useRef("");
  const hasFetchedRef = React.useRef(false);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);

  if (!initialTableStateRef.current) {
    initialTableStateRef.current = parseHospitalEventRealModelDBsTableState(new URLSearchParams(searchParams.toString()));
  }

  const initialTableState = initialTableStateRef.current;
  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftFilters, setDraftFilters] = React.useState<HospitalEventRealModelDBFilters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<HospitalEventRealModelDBFilters>(initialTableState.filters);
  const [sortState, setSortState] = React.useState<HospitalEventRealModelDBSortState>(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);
  const [rows, setRows] = React.useState<HospitalEventRealModelDBRow[]>([]);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const query = React.useMemo(
    () =>
      buildHospitalEventRealModelDBsQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        page,
      }),
    [appliedFilters, page, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildHospitalEventRealModelDBsQueryString(query), [query]);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  const fetchRealModelDBs = React.useCallback(
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
        const response = await api.get<HospitalEventRealModelDBApiItem[]>("/hospital-event-real-model-dbs", query, {
          latestKey: "hospital-event-real-model-dbs:list",
        });

        if (!isApiSuccess(response)) {
          setError(response.error.message || "리얼모델 신청 목록 조회에 실패했습니다.");
          return;
        }

        setRows(response.data.map(normalizeHospitalEventRealModelDB));
        setMeta((response.meta as DataTableMeta | null) ?? null);
        hasFetchedRef.current = true;
      } catch (error) {
        if (isApiRequestCanceledError(error)) {
          shouldFinalize = false;
          return;
        }

        setError("리얼모델 신청 목록 조회 중 오류가 발생했습니다.");
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
    void fetchRealModelDBs(false);
  }, [fetchRealModelDBs]);

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
    const mapped = mapDateRangeToHospitalEventRealModelDBFilter(normalizedRange);

    setDraftDateRange(normalizedRange);
    setDraftFilters((prev) => ({
      ...prev,
      dateRange: mapped.label,
      startDate: mapped.startDate,
      endDate: mapped.endDate,
    }));
  };

  const applyDatePreset = (preset: HospitalEventRealModelDBDatePresetKey) => {
    applyDateRange(buildHospitalEventRealModelDBPresetDateRange(preset));
    setIsDatePickerOpen(false);
  };

  const applyFilters = () => {
    setPage(1);
    setSearchKeyword(searchInput.trim());
    setAppliedFilters(draftFilters);
  };

  const resetFilters = () => {
    setDraftFilters(DEFAULT_HOSPITAL_EVENT_REAL_MODEL_DB_FILTERS);
    setAppliedFilters(DEFAULT_HOSPITAL_EVENT_REAL_MODEL_DB_FILTERS);
    setDraftDateRange(undefined);
    setSearchInput("");
    setSearchKeyword("");
    setPage(1);
    setIsDatePickerOpen(false);
  };

  const toggleSort = React.useCallback((field: HospitalEventRealModelDBSortField) => {
    setPage(1);
    setSortState((prev) => nextHospitalEventRealModelDBSortState(prev, field));
  }, []);

  return (
    <div className="min-w-0 space-y-4">
      <HospitalEventRealModelDBsFilterPanel
        searchInput={searchInput}
        draftFilters={draftFilters}
        draftDateRange={draftDateRange}
        isDatePickerOpen={isDatePickerOpen}
        datePickerRef={datePickerRef}
        onSearchChange={setSearchInput}
        onToggleDatePicker={() => setIsDatePickerOpen((prev) => !prev)}
        onApplyDateRange={applyDateRange}
        onApplyDatePreset={applyDatePreset}
        onGenderChange={(value) => setDraftFilters((prev) => ({ ...prev, gender: value }))}
        onStatusChange={(value) => setDraftFilters((prev) => ({ ...prev, status: value }))}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />

      <HospitalEventRealModelDBsDataTable
        rows={rows}
        meta={meta}
        loading={loading}
        refreshing={refreshing}
        error={error}
        sortState={sortState}
        onToggleSort={toggleSort}
        onRefresh={() => void fetchRealModelDBs(true)}
        onGoPage={setPage}
      />
    </div>
  );
}
