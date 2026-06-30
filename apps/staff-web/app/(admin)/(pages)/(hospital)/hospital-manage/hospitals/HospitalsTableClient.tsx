"use client";

import { HospitalsDataTable } from "@/components/hospital/list/HospitalsDataTable";
import { HospitalsFilterPanel } from "@/components/hospital/list/HospitalsFilterPanel";
import { HospitalsSummaryCards, type HospitalSummaryCardKey } from "@/components/hospital/list/HospitalsSummaryCards";
import { useListData } from "@/hooks/common/useListData";
import { api, isApiRequestCanceledError } from "@/lib/common/api";
import {
  ALLOW_STATUS_OPTIONS,
  DEFAULT_FILTERS,
  HOSPITAL_DEPARTMENT_OPTIONS,
  HOSPITAL_STATUS_OPTIONS,
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
  type HospitalSummary,
  type SortField,
  type SortState,
} from "@/lib/hospital/list";
import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import type { DateRange } from "react-day-picker";

function buildSummaryFilters(key: HospitalSummaryCardKey): Filters {
  const filters: Filters = {
    ...DEFAULT_FILTERS,
    departments: [],
    hospitalStatuses: [],
    reviewStatuses: [],
  };

  if (key === "pending") {
    return { ...filters, reviewStatuses: ["PENDING"] };
  }

  if (key === "rejected") {
    return { ...filters, reviewStatuses: ["REJECTED"] };
  }

  if (key === "dormant") {
    return { ...filters, dormantOnly: true };
  }

  if (key === "suspended") {
    return { ...filters, hospitalStatuses: ["SUSPENDED"] };
  }

  return { ...filters, hospitalStatuses: ["WITHDRAWN"] };
}

function resolveActiveSummaryKey(filters: Filters): HospitalSummaryCardKey | null {
  const hasBaseFilters =
    filters.departments.length > 0 || Boolean(filters.dateRange || filters.startDate || filters.endDate);

  if (hasBaseFilters) return null;

  if (filters.dormantOnly && filters.reviewStatuses.length === 0 && filters.hospitalStatuses.length === 0) {
    return "dormant";
  }

  if (!filters.dormantOnly && filters.reviewStatuses.length === 1 && filters.hospitalStatuses.length === 0) {
    if (filters.reviewStatuses[0] === "PENDING") return "pending";
    if (filters.reviewStatuses[0] === "REJECTED") return "rejected";
  }

  if (!filters.dormantOnly && filters.hospitalStatuses.length === 1 && filters.reviewStatuses.length === 0) {
    if (filters.hospitalStatuses[0] === "SUSPENDED") return "suspended";
    if (filters.hospitalStatuses[0] === "WITHDRAWN") return "withdrawn";
  }

  return null;
}

export default function HospitalsTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [initialTableState] = React.useState(() =>
    parseHospitalsTableState(new URLSearchParams(searchParams.toString())),
  );

  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = React.useState(false);
  const [isReviewDropdownOpen, setIsReviewDropdownOpen] = React.useState(false);
  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftFilters, setDraftFilters] = React.useState<Filters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(initialTableState.filters);
  const statusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const reviewDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const departmentDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);

  const [sortState, setSortState] = React.useState<SortState>(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);

  const [summary, setSummary] = React.useState<HospitalSummary | null>(null);
  const [highlightedRowId, setHighlightedRowId] = React.useState<number | null>(null);

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
  const activeSummaryKey = React.useMemo(() => resolveActiveSummaryKey(appliedFilters), [appliedFilters]);

  const buildReturnToPath = React.useCallback(() => {
    return buildHospitalsReturnToPath(pathname, query);
  }, [pathname, query]);

  const fetchHospitalRows = React.useCallback(async (nextQuery: typeof query) => {
    const response = await api.get<HospitalApiItem[]>("/hospitals", nextQuery, {
      latestKey: "hospitals:list",
    });
    if (!isApiSuccess(response)) {
      throw new Error(response.error.message || "병의원 목록 조회에 실패했습니다.");
    }

    return {
      rows: response.data.map(normalizeHospital),
      meta: (response.meta as DataTableMeta | null) ?? null,
    };
  }, []);

  const {
    rows,
    meta,
    error,
    loading,
    refreshing,
    fetchList: fetchHospitals,
  } = useListData({
    query,
    fetchRows: fetchHospitalRows,
    errorMessage: "병의원 목록 조회 중 오류가 발생했습니다.",
  });

  const fetchHospitalSummary = React.useCallback(async () => {
    try {
      const response = await api.get<HospitalSummary>("/hospitals/summary", undefined, {
        latestKey: "hospitals:summary",
      });
      if (!isApiSuccess(response)) return;

      setSummary(response.data);
    } catch (error) {
      if (isApiRequestCanceledError(error)) return;

      setSummary(null);
    }
  }, []);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  React.useEffect(() => {
    void fetchHospitalSummary();
  }, [fetchHospitalSummary]);

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
      if (!departmentDropdownRef.current?.contains(event.target as Node)) {
        setIsDepartmentDropdownOpen(false);
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
      departments: [...draftFilters.departments],
      hospitalStatuses: [...draftFilters.hospitalStatuses],
      reviewStatuses: [...draftFilters.reviewStatuses],
      dormantOnly: draftFilters.dormantOnly,
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
    setIsStatusDropdownOpen(false);
    setIsReviewDropdownOpen(false);
    setIsDepartmentDropdownOpen(false);
    setIsDatePickerOpen(false);
    setPage(1);
    setAppliedFilters(DEFAULT_FILTERS);
  };

  const applySummaryFilter = React.useCallback((key: HospitalSummaryCardKey) => {
    const nextFilters = buildSummaryFilters(key);

    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setDraftDateRange(undefined);
    setSearchInput("");
    setSearchKeyword("");
    setIsStatusDropdownOpen(false);
    setIsReviewDropdownOpen(false);
    setIsDepartmentDropdownOpen(false);
    setIsDatePickerOpen(false);
    setPage(1);
  }, []);

  const toggleReviewStatus = (value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.reviewStatuses.includes(value);
      return {
        ...prev,
        reviewStatuses: exists ? prev.reviewStatuses.filter((item) => item !== value) : [...prev.reviewStatuses, value],
      };
    });
  };

  const toggleHospitalStatus = (value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.hospitalStatuses.includes(value);
      return {
        ...prev,
        hospitalStatuses: exists
          ? prev.hospitalStatuses.filter((item) => item !== value)
          : [...prev.hospitalStatuses, value],
      };
    });
  };

  const toggleAllHospitalStatus = () => {
    setDraftFilters((prev) => ({
      ...prev,
      hospitalStatuses:
        prev.hospitalStatuses.length === HOSPITAL_STATUS_OPTIONS.length
          ? []
          : HOSPITAL_STATUS_OPTIONS.map((item) => item.value),
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

  const toggleDepartment = (value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.departments.includes(value);
      return {
        ...prev,
        departments: exists ? prev.departments.filter((item) => item !== value) : [...prev.departments, value],
      };
    });
  };

  const toggleAllDepartments = () => {
    setDraftFilters((prev) => ({
      ...prev,
      departments:
        prev.departments.length === HOSPITAL_DEPARTMENT_OPTIONS.length
          ? []
          : HOSPITAL_DEPARTMENT_OPTIONS.map((item) => item.value),
    }));
  };

  const applyDateRange = (
    _key: DateFilterKey,
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
  };

  const applyDatePreset = (key: DateFilterKey, preset: DatePresetKey) => {
    applyDateRange(key, buildPresetDateRange(preset), { closePicker: true });
  };

  const toggleSort = React.useCallback((field: SortField) => {
    setPage(1);
    setSortState((prev) => nextSortState(prev, field));
  }, []);

  const refreshHospitals = React.useCallback(() => {
    void Promise.all([fetchHospitals(true), fetchHospitalSummary()]);
  }, [fetchHospitalSummary, fetchHospitals]);

  return (
    <div className="min-w-0 space-y-4">
      <HospitalsSummaryCards summary={summary} activeKey={activeSummaryKey} onSelect={applySummaryFilter} />

      <HospitalsFilterPanel
        draftFilters={draftFilters}
        draftDateRange={draftDateRange}
        isStatusDropdownOpen={isStatusDropdownOpen}
        isReviewDropdownOpen={isReviewDropdownOpen}
        isDepartmentDropdownOpen={isDepartmentDropdownOpen}
        isDatePickerOpen={isDatePickerOpen}
        statusDropdownRef={statusDropdownRef}
        reviewDropdownRef={reviewDropdownRef}
        departmentDropdownRef={departmentDropdownRef}
        datePickerRef={datePickerRef}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onToggleStatusDropdown={() => setIsStatusDropdownOpen((prev) => !prev)}
        onToggleReviewDropdown={() => setIsReviewDropdownOpen((prev) => !prev)}
        onToggleDepartmentDropdown={() => setIsDepartmentDropdownOpen((prev) => !prev)}
        onToggleDatePicker={() => {
          setIsDatePickerOpen((prev) => !prev);
        }}
        onToggleHospitalStatus={toggleHospitalStatus}
        onToggleAllHospitalStatus={toggleAllHospitalStatus}
        onToggleReviewStatus={toggleReviewStatus}
        onToggleAllReviewStatus={toggleAllReviewStatus}
        onToggleDepartment={toggleDepartment}
        onToggleAllDepartments={toggleAllDepartments}
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
        onRefresh={refreshHospitals}
        onGoPage={(nextPage) => setPage(nextPage)}
        onRowClick={(row) => {
          const returnTo = buildReturnToPath();
          router.push(`/hospital-manage/hospitals/${row.id}?returnTo=${encodeURIComponent(returnTo)}`);
        }}
      />
    </div>
  );
}
