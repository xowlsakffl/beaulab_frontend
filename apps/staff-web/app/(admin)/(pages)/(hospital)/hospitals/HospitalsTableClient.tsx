"use client";

import { HospitalsDataTable } from "@/components/hospital/list/HospitalsDataTable";
import { HospitalsFilterPanel } from "@/components/hospital/list/HospitalsFilterPanel";
import { api } from "@/lib/common/api";
import {
  ALLOW_STATUS_OPTIONS,
  APPROVAL_STATUS_OPTIONS,
  DEFAULT_FILTERS,
  HOSPITALS_PER_PAGE,
  buildHospitalsQuery,
  buildHospitalsQueryString,
  buildHospitalsReturnToPath,
  buildPresetDateRange,
  mapDateRangeToFilter,
  nextSortState,
  normalizeHospital,
  normalizeRangeDate,
  parseHospitalsTableState,
  type DateFilterKey,
  type DatePresetKey,
  type Filters,
  type HospitalApiItem,
  type HospitalRow,
  type SortField,
  type SortState,
} from "@/lib/hospital/list";
import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import type { DateRange } from "react-day-picker";

export default function HospitalsTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTableStateRef = React.useRef<ReturnType<typeof parseHospitalsTableState> | null>(null);

  if (!initialTableStateRef.current) {
    initialTableStateRef.current = parseHospitalsTableState(new URLSearchParams(searchParams.toString()));
  }

  const initialTableState = initialTableStateRef.current;

  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = React.useState(false);
  const [isReviewDropdownOpen, setIsReviewDropdownOpen] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [isUpdatedDatePickerOpen, setIsUpdatedDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftUpdatedDateRange, setDraftUpdatedDateRange] = React.useState<DateRange | undefined>(initialTableState.draftUpdatedDateRange);
  const [draftFilters, setDraftFilters] = React.useState<Filters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(initialTableState.filters);
  const statusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const reviewDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);
  const updatedDatePickerRef = React.useRef<HTMLDivElement | null>(null);

  const [sortState, setSortState] = React.useState<SortState>(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);

  const [rows, setRows] = React.useState<HospitalRow[]>([]);
  const [highlightedRowId, setHighlightedRowId] = React.useState<number | null>(null);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const requestKeyRef = React.useRef("");
  const hasFetchedRef = React.useRef(false);

  const query = React.useMemo(
    () =>
      buildHospitalsQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        perPage: HOSPITALS_PER_PAGE,
        page,
      }),
    [appliedFilters, page, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildHospitalsQueryString(query), [query]);

  const buildReturnToPath = React.useCallback(() => {
    return buildHospitalsReturnToPath(pathname, query);
  }, [pathname, query]);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  const fetchHospitals = React.useCallback(
    async (manualRefresh = false) => {
      const requestKey = JSON.stringify(query);
      if (!manualRefresh && requestKeyRef.current === requestKey) return;
      requestKeyRef.current = requestKey;

      if (!hasFetchedRef.current) setLoading(true);
      else setRefreshing(true);
      if (manualRefresh) setRefreshing(true);

      setError(null);

      try {
        const response = await api.get<HospitalApiItem[]>("/hospitals", query);
        if (!isApiSuccess(response)) {
          setError(response.error.message || "병의원 목록 조회에 실패했습니다.");
          return;
        }

        setRows(response.data.map(normalizeHospital));
        setMeta((response.meta as DataTableMeta | null) ?? null);
        hasFetchedRef.current = true;
      } catch {
        setError("병의원 목록 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [query],
  );

  React.useEffect(() => {
    fetchHospitals(false);
  }, [fetchHospitals]);

  React.useEffect(() => {
    rows.slice(0, HOSPITALS_PER_PAGE).forEach((row) => {
      router.prefetch(`/hospitals/${row.id}`);
    });
  }, [router, rows]);

  React.useEffect(() => {
    const highlightParam = searchParams.get("highlight");
    if (!highlightParam) return;

    const parsedHighlightId = Number(highlightParam);
    if (!Number.isFinite(parsedHighlightId)) return;

    setHighlightedRowId(parsedHighlightId);

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("highlight");

    const nextQuery = nextSearchParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  React.useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!statusDropdownRef.current?.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (!reviewDropdownRef.current?.contains(event.target as Node)) {
        setIsReviewDropdownOpen(false);
      }
      if (!datePickerRef.current?.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
      if (!updatedDatePickerRef.current?.contains(event.target as Node)) {
        setIsUpdatedDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const applyFilters = () => {
    setPage(1);
    setSearchKeyword(searchInput.trim());
    setAppliedFilters({
      approvalStatuses: [...draftFilters.approvalStatuses],
      reviewStatuses: [...draftFilters.reviewStatuses],
      dateRange: draftFilters.dateRange,
      startDate: draftFilters.startDate,
      endDate: draftFilters.endDate,
      updatedDateRange: draftFilters.updatedDateRange,
      updatedStartDate: draftFilters.updatedStartDate,
      updatedEndDate: draftFilters.updatedEndDate,
    });
  };

  const resetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setDraftDateRange(undefined);
    setDraftUpdatedDateRange(undefined);
    setSearchInput("");
    setSearchKeyword("");
    setIsStatusDropdownOpen(false);
    setIsReviewDropdownOpen(false);
    setIsDatePickerOpen(false);
    setIsUpdatedDatePickerOpen(false);
    setPage(1);
    setAppliedFilters(DEFAULT_FILTERS);
  };

  const toggleReviewStatus = (value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.reviewStatuses.includes(value);
      return {
        ...prev,
        reviewStatuses: exists
          ? prev.reviewStatuses.filter((item) => item !== value)
          : [...prev.reviewStatuses, value],
      };
    });
  };

  const toggleApprovalStatus = (value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.approvalStatuses.includes(value);
      return {
        ...prev,
        approvalStatuses: exists
          ? prev.approvalStatuses.filter((item) => item !== value)
          : [...prev.approvalStatuses, value],
      };
    });
  };

  const toggleAllApprovalStatus = () => {
    setDraftFilters((prev) => ({
      ...prev,
      approvalStatuses:
        prev.approvalStatuses.length === APPROVAL_STATUS_OPTIONS.length
          ? []
          : APPROVAL_STATUS_OPTIONS.map((item) => item.value),
    }));
  };

  const toggleAllReviewStatus = () => {
    setDraftFilters((prev) => ({
      ...prev,
      reviewStatuses:
        prev.reviewStatuses.length === ALLOW_STATUS_OPTIONS.length
          ? []
          : ALLOW_STATUS_OPTIONS.map((item) => item.value),
    }));
  };

  const applyDateRange = (
    key: DateFilterKey,
    nextRange?: DateRange,
    options?: {
      closePicker?: boolean;
    },
  ) => {
    const normalizedRange =
      nextRange?.from || nextRange?.to
        ? {
            from: nextRange?.from ? normalizeRangeDate(nextRange.from) : undefined,
            to: nextRange?.to ? normalizeRangeDate(nextRange.to) : undefined,
          }
        : undefined;
    const mapped = mapDateRangeToFilter(normalizedRange);

    if (key === "created") {
      setDraftDateRange(normalizedRange);
      setDraftFilters((prev) => ({
        ...prev,
        dateRange: mapped.label,
        startDate: mapped.startDate,
        endDate: mapped.endDate,
      }));

      if (options?.closePicker) {
        setIsDatePickerOpen(false);
      }

      return;
    }

    setDraftUpdatedDateRange(normalizedRange);
    setDraftFilters((prev) => ({
      ...prev,
      updatedDateRange: mapped.label,
      updatedStartDate: mapped.startDate,
      updatedEndDate: mapped.endDate,
    }));

    if (options?.closePicker) {
      setIsUpdatedDatePickerOpen(false);
    }
  };

  const applyDatePreset = (key: DateFilterKey, preset: DatePresetKey) => {
    applyDateRange(key, buildPresetDateRange(preset), { closePicker: true });
  };

  const toggleSort = React.useCallback((field: SortField) => {
    setPage(1);
    setSortState((prev) => nextSortState(prev, field));
  }, []);

  return (
    <div className="min-w-0 space-y-4">
      <HospitalsFilterPanel
        draftFilters={draftFilters}
        draftDateRange={draftDateRange}
        draftUpdatedDateRange={draftUpdatedDateRange}
        isStatusDropdownOpen={isStatusDropdownOpen}
        isReviewDropdownOpen={isReviewDropdownOpen}
        isDatePickerOpen={isDatePickerOpen}
        isUpdatedDatePickerOpen={isUpdatedDatePickerOpen}
        statusDropdownRef={statusDropdownRef}
        reviewDropdownRef={reviewDropdownRef}
        datePickerRef={datePickerRef}
        updatedDatePickerRef={updatedDatePickerRef}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onToggleStatusDropdown={() => setIsStatusDropdownOpen((prev) => !prev)}
        onToggleReviewDropdown={() => setIsReviewDropdownOpen((prev) => !prev)}
        onToggleDatePicker={() => {
          setIsUpdatedDatePickerOpen(false);
          setIsDatePickerOpen((prev) => !prev);
        }}
        onToggleUpdatedDatePicker={() => {
          setIsDatePickerOpen(false);
          setIsUpdatedDatePickerOpen((prev) => !prev);
        }}
        onToggleApprovalStatus={toggleApprovalStatus}
        onToggleAllApprovalStatus={toggleAllApprovalStatus}
        onToggleReviewStatus={toggleReviewStatus}
        onToggleAllReviewStatus={toggleAllReviewStatus}
        onApplyDateRange={(key, nextRange) => applyDateRange(key, nextRange)}
        onApplyDatePreset={applyDatePreset}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />

      <HospitalsDataTable
        rows={rows}
        meta={meta}
        loading={loading}
        refreshing={refreshing}
        error={error}
        highlightedRowId={highlightedRowId}
        sortState={sortState}
        onToggleSort={toggleSort}
        onRefresh={() => fetchHospitals(true)}
        onGoPage={(nextPage) => setPage(nextPage)}
        onRowClick={(row) => {
          const returnTo = buildReturnToPath();
          router.push(`/hospitals/${row.id}?returnTo=${encodeURIComponent(returnTo)}`);
        }}
      />
    </div>
  );
}
