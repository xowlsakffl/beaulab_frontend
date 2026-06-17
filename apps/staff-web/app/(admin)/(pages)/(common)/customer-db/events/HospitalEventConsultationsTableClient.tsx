"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin";

import { HospitalEventConsultationsDataTable } from "@/components/hospital-event-consultation/list/HospitalEventConsultationsDataTable";
import { HospitalEventConsultationsFilterPanel } from "@/components/hospital-event-consultation/list/HospitalEventConsultationsFilterPanel";
import { api, isApiRequestCanceledError } from "@/lib/common/api";
import {
  DEFAULT_HOSPITAL_EVENT_CONSULTATION_FILTERS,
  buildHospitalEventConsultationPresetDateRange,
  buildHospitalEventConsultationsQuery,
  buildHospitalEventConsultationsQueryString,
  mapDateRangeToHospitalEventConsultationFilter,
  nextHospitalEventConsultationSortState,
  normalizeHospitalEventConsultation,
  normalizeNumberBound,
  normalizeRangeDate,
  parseHospitalEventConsultationsTableState,
  type HospitalEventConsultationAmountMetric,
  type HospitalEventConsultationApiItem,
  type HospitalEventConsultationDatePresetKey,
  type HospitalEventConsultationFilters,
  type HospitalEventConsultationRow,
  type HospitalEventConsultationSortField,
  type HospitalEventConsultationSortState,
} from "@/lib/hospital-event-consultation/list";

export default function HospitalEventConsultationsTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTableStateRef = React.useRef<ReturnType<typeof parseHospitalEventConsultationsTableState> | null>(null);
  const requestKeyRef = React.useRef("");
  const hasFetchedRef = React.useRef(false);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);

  if (!initialTableStateRef.current) {
    initialTableStateRef.current = parseHospitalEventConsultationsTableState(new URLSearchParams(searchParams.toString()));
  }

  const initialTableState = initialTableStateRef.current;
  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftFilters, setDraftFilters] = React.useState<HospitalEventConsultationFilters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<HospitalEventConsultationFilters>(initialTableState.filters);
  const [sortState, setSortState] = React.useState<HospitalEventConsultationSortState>(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);
  const [rows, setRows] = React.useState<HospitalEventConsultationRow[]>([]);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const query = React.useMemo(
    () =>
      buildHospitalEventConsultationsQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        page,
      }),
    [appliedFilters, page, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildHospitalEventConsultationsQueryString(query), [query]);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  const fetchConsultations = React.useCallback(
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
        const response = await api.get<HospitalEventConsultationApiItem[]>("/hospital-event-consultations", query, {
          latestKey: "hospital-event-consultations:list",
        });

        if (!isApiSuccess(response)) {
          setError(response.error.message || "이벤트 DB 목록 조회에 실패했습니다.");
          return;
        }

        setRows(response.data.map(normalizeHospitalEventConsultation));
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
    void fetchConsultations(false);
  }, [fetchConsultations]);

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
    const mapped = mapDateRangeToHospitalEventConsultationFilter(normalizedRange);

    setDraftDateRange(normalizedRange);
    setDraftFilters((prev) => ({
      ...prev,
      dateRange: mapped.label,
      startDate: mapped.startDate,
      endDate: mapped.endDate,
    }));
  };

  const applyDatePreset = (preset: HospitalEventConsultationDatePresetKey) => {
    applyDateRange(buildHospitalEventConsultationPresetDateRange(preset));
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
    setDraftFilters(DEFAULT_HOSPITAL_EVENT_CONSULTATION_FILTERS);
    setAppliedFilters(DEFAULT_HOSPITAL_EVENT_CONSULTATION_FILTERS);
    setDraftDateRange(undefined);
    setSearchInput("");
    setSearchKeyword("");
    setPage(1);
    setIsDatePickerOpen(false);
  };

  const toggleSort = React.useCallback((field: HospitalEventConsultationSortField) => {
    setPage(1);
    setSortState((prev) => nextHospitalEventConsultationSortState(prev, field));
  }, []);

  return (
    <div className="min-w-0 space-y-4">
      <HospitalEventConsultationsFilterPanel
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
        onAmountMetricChange={(value: HospitalEventConsultationAmountMetric) => setDraftFilters((prev) => ({ ...prev, amountMetric: value }))}
        onAmountMinChange={(value) => setDraftFilters((prev) => ({ ...prev, amountMin: value }))}
        onAmountMaxChange={(value) => setDraftFilters((prev) => ({ ...prev, amountMax: value }))}
        onStatusChange={(value) => setDraftFilters((prev) => ({ ...prev, status: value }))}
        onAllowStatusChange={(value) => setDraftFilters((prev) => ({ ...prev, allowStatus: value }))}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />

      <HospitalEventConsultationsDataTable
        rows={rows}
        meta={meta}
        loading={loading}
        refreshing={refreshing}
        error={error}
        sortState={sortState}
        onToggleSort={toggleSort}
        onRefresh={() => void fetchConsultations(true)}
        onGoPage={setPage}
      />
    </div>
  );
}
