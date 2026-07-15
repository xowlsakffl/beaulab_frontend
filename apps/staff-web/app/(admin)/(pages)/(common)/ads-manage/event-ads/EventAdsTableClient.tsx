"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin";

import { EventAdsDataTable } from "@/components/hospital-event-ad/list/EventAdsDataTable";
import { EventAdsFilterPanel } from "@/components/hospital-event-ad/list/EventAdsFilterPanel";
import { useListData } from "@/hooks/common/useListData";
import { api } from "@/lib/common/api";
import {
  DEFAULT_EVENT_AD_FILTERS,
  EVENT_AD_ALLOW_STATUS_OPTIONS,
  EVENT_AD_PLACEMENT_OPTIONS,
  EVENT_AD_STATUS_OPTIONS,
  buildEventAdPresetDateRange,
  buildEventAdsQuery,
  buildEventAdsQueryString,
  mapDateRangeToEventAdFilter,
  nextEventAdSortState,
  normalizeEventAd,
  normalizeEventAdRangeDate,
  parseEventAdsTableState,
  type EventAdApiItem,
  type EventAdDatePresetKey,
  type EventAdDateType,
  type EventAdFilters,
  type EventAdRow,
  type EventAdSortField,
  type EventAdSortState,
} from "@/lib/hospital-event-ad/list";

function cloneDefaultFilters(): EventAdFilters {
  return {
    ...DEFAULT_EVENT_AD_FILTERS,
    dateTypes: [...DEFAULT_EVENT_AD_FILTERS.dateTypes],
    placements: [...DEFAULT_EVENT_AD_FILTERS.placements],
    allowStatuses: [...DEFAULT_EVENT_AD_FILTERS.allowStatuses],
    adStatuses: [...DEFAULT_EVENT_AD_FILTERS.adStatuses],
  };
}

function cloneFilters(filters: EventAdFilters): EventAdFilters {
  return {
    ...filters,
    dateTypes: [...filters.dateTypes],
    placements: [...filters.placements],
    allowStatuses: [...filters.allowStatuses],
    adStatuses: [...filters.adStatuses],
  };
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export default function EventAdsTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [initialTableState] = React.useState(() =>
    parseEventAdsTableState(new URLSearchParams(searchParams.toString())),
  );

  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [draftFilters, setDraftFilters] = React.useState<EventAdFilters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<EventAdFilters>(initialTableState.filters);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [sortState, setSortState] = React.useState<EventAdSortState>(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [isPlacementDropdownOpen, setIsPlacementDropdownOpen] = React.useState(false);
  const [isAllowStatusDropdownOpen, setIsAllowStatusDropdownOpen] = React.useState(false);
  const [isAdStatusDropdownOpen, setIsAdStatusDropdownOpen] = React.useState(false);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);
  const placementDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const allowStatusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const adStatusDropdownRef = React.useRef<HTMLDivElement | null>(null);

  const query = React.useMemo(
    () =>
      buildEventAdsQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        page,
      }),
    [appliedFilters, page, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildEventAdsQueryString(query), [query]);

  const fetchEventAdRows = React.useCallback(async (nextQuery: typeof query) => {
    const response = await api.get<EventAdApiItem[]>("/hospital-event-ads", nextQuery, {
      latestKey: "hospital-event-ads:list",
    });

    if (!isApiSuccess(response)) {
      throw new Error(response.error.message || "이벤트 광고 목록 조회에 실패했습니다.");
    }

    return {
      rows: response.data.map(normalizeEventAd),
      meta: (response.meta as DataTableMeta | null) ?? null,
    };
  }, []);

  const {
    rows,
    meta,
    error,
    loading,
    refreshing,
    fetchList: fetchEventAds,
  } = useListData({
    query,
    fetchRows: fetchEventAdRows,
    errorMessage: "이벤트 광고 목록 조회 중 오류가 발생했습니다.",
  });

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  React.useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!datePickerRef.current?.contains(target)) {
        setIsDatePickerOpen(false);
      }
      if (!placementDropdownRef.current?.contains(target)) {
        setIsPlacementDropdownOpen(false);
      }
      if (!allowStatusDropdownRef.current?.contains(target)) {
        setIsAllowStatusDropdownOpen(false);
      }
      if (!adStatusDropdownRef.current?.contains(target)) {
        setIsAdStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const closeFilterDropdowns = React.useCallback(() => {
    setIsDatePickerOpen(false);
    setIsPlacementDropdownOpen(false);
    setIsAllowStatusDropdownOpen(false);
    setIsAdStatusDropdownOpen(false);
  }, []);

  const applyFilters = React.useCallback(() => {
    setPage(1);
    setSearchKeyword(searchInput.trim());
    setAppliedFilters(cloneFilters(draftFilters));
  }, [draftFilters, searchInput]);

  const resetFilters = React.useCallback(() => {
    const defaultFilters = cloneDefaultFilters();

    setPage(1);
    setSearchInput("");
    setSearchKeyword("");
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setDraftDateRange(undefined);
    closeFilterDropdowns();
  }, [closeFilterDropdowns]);

  const applyDateRange = React.useCallback((nextRange?: DateRange) => {
    const normalizedRange =
      nextRange?.from || nextRange?.to
        ? {
            from: nextRange?.from ? normalizeEventAdRangeDate(nextRange.from) : undefined,
            to: nextRange?.to ? normalizeEventAdRangeDate(nextRange.to) : undefined,
          }
        : undefined;
    const mapped = mapDateRangeToEventAdFilter(normalizedRange);

    setDraftDateRange(normalizedRange);
    setDraftFilters((prev) => ({
      ...prev,
      dateRange: mapped.label,
      startDate: mapped.startDate,
      endDate: mapped.endDate,
    }));
  }, []);

  const applyDatePreset = React.useCallback(
    (preset: EventAdDatePresetKey) => {
      applyDateRange(buildEventAdPresetDateRange(preset));
      setIsDatePickerOpen(false);
    },
    [applyDateRange],
  );

  const toggleDateType = React.useCallback((value: EventAdDateType) => {
    setDraftFilters((prev) => ({
      ...prev,
      dateTypes: [value],
    }));
  }, []);

  const togglePlacement = React.useCallback((value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      placements: toggleValue(prev.placements, value),
    }));
  }, []);

  const toggleAllPlacement = React.useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      placements:
        prev.placements.length === EVENT_AD_PLACEMENT_OPTIONS.length
          ? []
          : EVENT_AD_PLACEMENT_OPTIONS.map((option) => option.value),
    }));
  }, []);

  const toggleAllowStatus = React.useCallback((value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      allowStatuses: toggleValue(prev.allowStatuses, value),
    }));
  }, []);

  const toggleAllAllowStatus = React.useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      allowStatuses:
        prev.allowStatuses.length === EVENT_AD_ALLOW_STATUS_OPTIONS.length
          ? []
          : EVENT_AD_ALLOW_STATUS_OPTIONS.map((option) => option.value),
    }));
  }, []);

  const toggleAdStatus = React.useCallback((value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      adStatuses: toggleValue(prev.adStatuses, value),
    }));
  }, []);

  const toggleAllAdStatus = React.useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      adStatuses:
        prev.adStatuses.length === EVENT_AD_STATUS_OPTIONS.length
          ? []
          : EVENT_AD_STATUS_OPTIONS.map((option) => option.value),
    }));
  }, []);

  const handleToggleSort = React.useCallback((field: EventAdSortField) => {
    setPage(1);
    setSortState((prev) => nextEventAdSortState(prev, field));
  }, []);

  const handleGoPage = React.useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  const handleRefresh = React.useCallback(() => {
    void fetchEventAds(true);
  }, [fetchEventAds]);

  const openEventAdDetailPage = React.useCallback(
    (row: EventAdRow) => {
      const returnTo = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(`/ads-manage/event-ads/${row.id}?returnTo=${encodeURIComponent(returnTo)}`);
    },
    [pathname, queryString, router],
  );

  return (
    <div className="min-w-0 space-y-4">
      <EventAdsFilterPanel
        searchInput={searchInput}
        draftFilters={draftFilters}
        draftDateRange={draftDateRange}
        isDatePickerOpen={isDatePickerOpen}
        isPlacementDropdownOpen={isPlacementDropdownOpen}
        isAllowStatusDropdownOpen={isAllowStatusDropdownOpen}
        isAdStatusDropdownOpen={isAdStatusDropdownOpen}
        datePickerRef={datePickerRef}
        placementDropdownRef={placementDropdownRef}
        allowStatusDropdownRef={allowStatusDropdownRef}
        adStatusDropdownRef={adStatusDropdownRef}
        onSearchChange={setSearchInput}
        onToggleDatePicker={() => {
          setIsPlacementDropdownOpen(false);
          setIsAllowStatusDropdownOpen(false);
          setIsAdStatusDropdownOpen(false);
          setIsDatePickerOpen((prev) => !prev);
        }}
        onTogglePlacementDropdown={() => {
          setIsDatePickerOpen(false);
          setIsAllowStatusDropdownOpen(false);
          setIsAdStatusDropdownOpen(false);
          setIsPlacementDropdownOpen((prev) => !prev);
        }}
        onToggleAllowStatusDropdown={() => {
          setIsDatePickerOpen(false);
          setIsPlacementDropdownOpen(false);
          setIsAdStatusDropdownOpen(false);
          setIsAllowStatusDropdownOpen((prev) => !prev);
        }}
        onToggleAdStatusDropdown={() => {
          setIsDatePickerOpen(false);
          setIsPlacementDropdownOpen(false);
          setIsAllowStatusDropdownOpen(false);
          setIsAdStatusDropdownOpen((prev) => !prev);
        }}
        onToggleDateType={toggleDateType}
        onTogglePlacement={togglePlacement}
        onToggleAllPlacement={toggleAllPlacement}
        onToggleAllowStatus={toggleAllowStatus}
        onToggleAllAllowStatus={toggleAllAllowStatus}
        onToggleAdStatus={toggleAdStatus}
        onToggleAllAdStatus={toggleAllAdStatus}
        onApplyDateRange={applyDateRange}
        onApplyDatePreset={applyDatePreset}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />

      <EventAdsDataTable
        rows={rows}
        meta={meta}
        loading={loading}
        refreshing={refreshing}
        error={error}
        sortState={sortState}
        onToggleSort={handleToggleSort}
        onRefresh={handleRefresh}
        onGoPage={handleGoPage}
        onOpenDetail={openEventAdDetailPage}
      />
    </div>
  );
}
