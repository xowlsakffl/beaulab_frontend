"use client";

import React from "react";

import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";

import { TalksDataTable } from "@/components/talk/list/TalksDataTable";
import { TalksFilterPanel } from "@/components/talk/list/TalksFilterPanel";
import { TalksToolbar } from "@/components/talk/list/TalksToolbar";
import type { CategoryApiItem } from "@/lib/common/category";
import { api } from "@/lib/common/api";
import {
  DEFAULT_FILTERS,
  HOSPITAL_COMMUNITY_DOMAIN,
  TALK_STATUS_OPTIONS,
  buildPresetDateRange,
  buildTalksQuery,
  buildTalksQueryString,
  mapDateRangeToFilter,
  nextSortState,
  normalizeRangeDate,
  normalizeTalk,
  parseTalksTableState,
  type DatePresetKey,
  type Filters,
  type SortField,
  type SortState,
  type TalkApiItem,
  type TalkRow,
} from "@/lib/talk/list";

type TalkCategoryOption = {
  value: string;
  label: string;
};

export default function TalksTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTableStateRef = React.useRef<ReturnType<typeof parseTalksTableState> | null>(null);
  const hasFetchedRef = React.useRef(false);
  const requestKeyRef = React.useRef("");

  if (!initialTableStateRef.current) {
    initialTableStateRef.current = parseTalksTableState(new URLSearchParams(searchParams.toString()));
  }

  const initialTableState = initialTableStateRef.current;

  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [isFilterOpen, setIsFilterOpen] = React.useState(true);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftFilters, setDraftFilters] = React.useState<Filters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(initialTableState.filters);
  const [sortState, setSortState] = React.useState<SortState>(initialTableState.sortState);
  const [perPage, setPerPage] = React.useState(initialTableState.perPage);
  const [page, setPage] = React.useState(initialTableState.page);
  const [rows, setRows] = React.useState<TalkRow[]>([]);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [categoryOptions, setCategoryOptions] = React.useState<TalkCategoryOption[]>([]);
  const [categoryLoading, setCategoryLoading] = React.useState(true);
  const [categoryError, setCategoryError] = React.useState<string | null>(null);
  const statusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);

  const query = React.useMemo(
    () =>
      buildTalksQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        perPage,
        page,
      }),
    [appliedFilters, page, perPage, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildTalksQueryString(query), [query]);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  const fetchTalks = React.useCallback(
    async (manualRefresh = false) => {
      const requestKey = JSON.stringify(query);
      if (!manualRefresh && requestKeyRef.current === requestKey) return;
      requestKeyRef.current = requestKey;

      if (!hasFetchedRef.current) setLoading(true);
      else setRefreshing(true);
      if (manualRefresh) setRefreshing(true);

      setError(null);

      try {
        const response = await api.get<TalkApiItem[]>("/talks", query);

        if (!isApiSuccess(response)) {
          setError(response.error.message || "토크 목록 조회에 실패했습니다.");
          return;
        }

        setRows(response.data.map(normalizeTalk));
        setMeta((response.meta as DataTableMeta | null) ?? null);
        hasFetchedRef.current = true;
      } catch {
        setError("토크 목록 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [query],
  );

  React.useEffect(() => {
    void fetchTalks(false);
  }, [fetchTalks]);

  React.useEffect(() => {
    const fetchCategoryOptions = async () => {
      setCategoryLoading(true);
      setCategoryError(null);

      try {
        const response = await api.get<CategoryApiItem[]>("/categories/selector", {
          domain: HOSPITAL_COMMUNITY_DOMAIN,
          status: ["ACTIVE"],
          depth: 2,
          per_page: 100,
        });

        if (!isApiSuccess(response)) {
          setCategoryError(response.error.message || "카테고리 목록을 불러오지 못했습니다.");
          return;
        }

        const selectableItems = response.data
          .filter((item) => item.status === "ACTIVE")
          .map((item) => ({
            value: String(item.id),
            label: item.name,
          }));

        setCategoryOptions(selectableItems);
      } catch {
        setCategoryError("카테고리 목록을 불러오지 못했습니다.");
      } finally {
        setCategoryLoading(false);
      }
    };

    void fetchCategoryOptions();
  }, []);

  React.useEffect(() => {
    if (searchInput.trim() === searchKeyword) return;

    const timer = window.setTimeout(() => {
      setPage(1);
      setSearchKeyword(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput, searchKeyword]);

  React.useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!statusDropdownRef.current?.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (!datePickerRef.current?.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const applyFilters = React.useCallback(() => {
    setPage(1);
    setAppliedFilters({
      statuses: [...draftFilters.statuses],
      categoryId: draftFilters.categoryId,
      dateRange: draftFilters.dateRange,
      startDate: draftFilters.startDate,
      endDate: draftFilters.endDate,
    });
  }, [draftFilters]);

  const resetFilters = React.useCallback(() => {
    setDraftFilters(DEFAULT_FILTERS);
    setDraftDateRange(undefined);
    setIsStatusDropdownOpen(false);
    setIsDatePickerOpen(false);
    setPage(1);
    setAppliedFilters(DEFAULT_FILTERS);
  }, []);

  const toggleStatus = React.useCallback((value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.statuses.includes(value);
      return {
        ...prev,
        statuses: exists
          ? prev.statuses.filter((item) => item !== value)
          : [...prev.statuses, value],
      };
    });
  }, []);

  const toggleAllStatus = React.useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.length === TALK_STATUS_OPTIONS.length
        ? []
        : TALK_STATUS_OPTIONS.map((item) => item.value),
    }));
  }, []);

  const applyDateRange = React.useCallback((nextRange?: DateRange) => {
    setDraftDateRange(nextRange);
    const normalizedRange = nextRange
      ? {
          from: nextRange.from ? normalizeRangeDate(nextRange.from) : undefined,
          to: nextRange.to ? normalizeRangeDate(nextRange.to) : undefined,
        }
      : undefined;
    const mapped = mapDateRangeToFilter(normalizedRange);

    setDraftFilters((prev) => ({
      ...prev,
      dateRange: mapped.label,
      startDate: mapped.startDate,
      endDate: mapped.endDate,
    }));
  }, []);

  const applyDatePreset = React.useCallback((preset: DatePresetKey) => {
    applyDateRange(buildPresetDateRange(preset));
  }, [applyDateRange]);

  const handleToggleSort = React.useCallback((field: SortField) => {
    setPage(1);
    setSortState((prev) => nextSortState(prev, field));
  }, []);

  return (
    <div className="space-y-4">
      <TalksToolbar
        searchInput={searchInput}
        isFilterOpen={isFilterOpen}
        onSearchChange={setSearchInput}
        onToggleFilters={() => setIsFilterOpen((prev) => !prev)}
      />

      <TalksFilterPanel
        isOpen={isFilterOpen}
        draftFilters={draftFilters}
        categoryOptions={categoryOptions}
        categoryLoading={categoryLoading}
        categoryError={categoryError}
        draftDateRange={draftDateRange}
        isStatusDropdownOpen={isStatusDropdownOpen}
        isDatePickerOpen={isDatePickerOpen}
        statusDropdownRef={statusDropdownRef}
        datePickerRef={datePickerRef}
        onToggleFilters={() => setIsFilterOpen((prev) => !prev)}
        onToggleStatusDropdown={() => setIsStatusDropdownOpen((prev) => !prev)}
        onToggleDatePicker={() => setIsDatePickerOpen((prev) => !prev)}
        onToggleStatus={toggleStatus}
        onToggleAllStatus={toggleAllStatus}
        onCategoryChange={(value) => setDraftFilters((prev) => ({ ...prev, categoryId: value }))}
        onApplyDateRange={applyDateRange}
        onApplyDatePreset={applyDatePreset}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />

      <TalksDataTable
        rows={rows}
        meta={meta}
        loading={loading}
        refreshing={refreshing}
        error={error}
        sortState={sortState}
        perPage={perPage}
        onToggleSort={handleToggleSort}
        onRefresh={() => void fetchTalks(true)}
        onGoPage={setPage}
        onPerPageChange={(value) => {
          setPerPage(value);
          setPage(1);
        }}
      />
    </div>
  );
}
