"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

import { NoticesDataTable } from "@/components/notice/list/NoticesDataTable";
import { NoticesFilterPanel } from "@/components/notice/list/NoticesFilterPanel";
import { NoticesToolbar } from "@/components/notice/list/NoticesToolbar";
import { api } from "@/lib/common/api";
import {
  buildPresetDateRange,
  buildNoticesQuery,
  buildNoticesReturnToPath,
  buildNoticesQueryString,
  DATE_PRESET_OPTIONS,
  DEFAULT_FILTERS,
  mapDateRangeToFilter,
  nextSortState,
  normalizeNotice,
  NOTICE_CHANNEL_OPTIONS,
  NOTICE_STATUS_OPTIONS,
  normalizeRangeDate,
  parseNoticesTableState,
  type DateFilterKey,
  type DatePresetKey,
  type Filters,
  type NoticeApiItem,
  type SortField,
  type SortState,
} from "@/lib/notice/list";

export default function NoticesTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTableStateRef = React.useRef<ReturnType<typeof parseNoticesTableState> | null>(null);

  if (!initialTableStateRef.current) {
    initialTableStateRef.current = parseNoticesTableState(new URLSearchParams(searchParams.toString()));
  }

  const initialTableState = initialTableStateRef.current;

  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [isFilterOpen, setIsFilterOpen] = React.useState(true);
  const [draftFilters, setDraftFilters] = React.useState<Filters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(initialTableState.filters);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = React.useState(false);
  const [isChannelDropdownOpen, setIsChannelDropdownOpen] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [isUpdatedDatePickerOpen, setIsUpdatedDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftUpdatedDateRange, setDraftUpdatedDateRange] = React.useState<DateRange | undefined>(
    initialTableState.draftUpdatedDateRange,
  );
  const statusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const channelDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);
  const updatedDatePickerRef = React.useRef<HTMLDivElement | null>(null);

  const [sortState, setSortState] = React.useState<SortState>(initialTableState.sortState);
  const [perPage, setPerPage] = React.useState(initialTableState.perPage);
  const [page, setPage] = React.useState(initialTableState.page);

  const [rows, setRows] = React.useState<ReturnType<typeof normalizeNotice>[]>([]);
  const [highlightedRowId, setHighlightedRowId] = React.useState<number | null>(null);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const requestKeyRef = React.useRef("");
  const hasFetchedRef = React.useRef(false);

  const query = React.useMemo(
    () =>
      buildNoticesQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        perPage,
        page,
      }),
    [appliedFilters, page, perPage, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildNoticesQueryString(query), [query]);
  const buildReturnToPath = React.useCallback(() => buildNoticesReturnToPath(pathname, query), [pathname, query]);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  const fetchNotices = React.useCallback(
    async (manualRefresh = false) => {
      const requestKey = JSON.stringify(query);
      if (!manualRefresh && requestKeyRef.current === requestKey) return;
      requestKeyRef.current = requestKey;

      if (!hasFetchedRef.current) setLoading(true);
      else setRefreshing(true);
      if (manualRefresh) setRefreshing(true);

      setError(null);

      try {
        const response = await api.get<NoticeApiItem[]>("/notices", query);
        if (!isApiSuccess(response)) {
          setError(response.error.message || "공지사항 목록 조회에 실패했습니다.");
          return;
        }

        const responseMeta = (response.meta as DataTableMeta | null) ?? null;

        setRows(response.data.map(normalizeNotice));
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
      } catch {
        setError("공지사항 목록 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [query],
  );

  React.useEffect(() => {
    fetchNotices(false);
  }, [fetchNotices]);

  React.useEffect(() => {
    rows.slice(0, 15).forEach((row) => {
      router.prefetch(`/notices/${row.id}`);
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

      if (!channelDropdownRef.current?.contains(event.target as Node)) {
        setIsChannelDropdownOpen(false);
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

  const applyFilters = React.useCallback(() => {
    setPage(1);
    setAppliedFilters({
      statuses: [...draftFilters.statuses],
      channels: [...draftFilters.channels],
      dateRange: draftFilters.dateRange,
      startDate: draftFilters.startDate,
      endDate: draftFilters.endDate,
      updatedDateRange: draftFilters.updatedDateRange,
      updatedStartDate: draftFilters.updatedStartDate,
      updatedEndDate: draftFilters.updatedEndDate,
    });
  }, [draftFilters]);

  const resetFilters = React.useCallback(() => {
    setPage(1);
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setDraftDateRange(undefined);
    setDraftUpdatedDateRange(undefined);
    setIsStatusDropdownOpen(false);
    setIsChannelDropdownOpen(false);
    setIsDatePickerOpen(false);
    setIsUpdatedDatePickerOpen(false);
  }, []);

  const applyDateRange = React.useCallback(
    (
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
        if (options?.closePicker) setIsDatePickerOpen(false);
        return;
      }

      setDraftUpdatedDateRange(normalizedRange);
      setDraftFilters((prev) => ({
        ...prev,
        updatedDateRange: mapped.label,
        updatedStartDate: mapped.startDate,
        updatedEndDate: mapped.endDate,
      }));
      if (options?.closePicker) setIsUpdatedDatePickerOpen(false);
    },
    [],
  );

  const applyDatePreset = React.useCallback(
    (key: DateFilterKey, preset: DatePresetKey) => {
      applyDateRange(key, buildPresetDateRange(preset), { closePicker: true });
    },
    [applyDateRange],
  );

  const handleToggleStatus = React.useCallback((value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(value)
        ? prev.statuses.filter((item) => item !== value)
        : [...prev.statuses, value],
    }));
  }, []);

  const handleToggleChannel = React.useCallback((value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      channels: prev.channels.includes(value)
        ? prev.channels.filter((item) => item !== value)
        : [...prev.channels, value],
    }));
  }, []);

  const handleToggleAllStatuses = React.useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.length === NOTICE_STATUS_OPTIONS.length ? [] : NOTICE_STATUS_OPTIONS.map((option) => option.value),
    }));
  }, []);

  const handleToggleAllChannels = React.useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      channels: prev.channels.length === NOTICE_CHANNEL_OPTIONS.length ? [] : NOTICE_CHANNEL_OPTIONS.map((option) => option.value),
    }));
  }, []);

  const handleToggleSort = React.useCallback((field: SortField) => {
    setPage(1);
    setSortState((prev) => nextSortState(prev, field));
  }, []);

  const handlePerPageChange = React.useCallback((value: number) => {
    setPerPage(value);
    setPage(1);
  }, []);

  return (
    <div className="min-w-0 space-y-6">
      <NoticesToolbar
        searchInput={searchInput}
        isFilterOpen={isFilterOpen}
        onSearchChange={setSearchInput}
        onToggleFilters={() => setIsFilterOpen((prev) => !prev)}
      />

      <NoticesFilterPanel
        isOpen={isFilterOpen}
        draftStatuses={draftFilters.statuses}
        draftChannels={draftFilters.channels}
        draftDateLabel={draftFilters.dateRange}
        draftUpdatedDateLabel={draftFilters.updatedDateRange}
        isStatusDropdownOpen={isStatusDropdownOpen}
        isChannelDropdownOpen={isChannelDropdownOpen}
        isDatePickerOpen={isDatePickerOpen}
        isUpdatedDatePickerOpen={isUpdatedDatePickerOpen}
        statusDropdownRef={statusDropdownRef}
        channelDropdownRef={channelDropdownRef}
        datePickerRef={datePickerRef}
        updatedDatePickerRef={updatedDatePickerRef}
        statusOptions={NOTICE_STATUS_OPTIONS}
        channelOptions={NOTICE_CHANNEL_OPTIONS}
        datePresetOptions={DATE_PRESET_OPTIONS}
        draftDateRange={draftDateRange}
        draftUpdatedDateRange={draftUpdatedDateRange}
        onToggleFilters={() => setIsFilterOpen((prev) => !prev)}
        onToggleStatusDropdown={() => setIsStatusDropdownOpen((prev) => !prev)}
        onToggleChannelDropdown={() => setIsChannelDropdownOpen((prev) => !prev)}
        onToggleDatePicker={() => setIsDatePickerOpen((prev) => !prev)}
        onToggleUpdatedDatePicker={() => setIsUpdatedDatePickerOpen((prev) => !prev)}
        onToggleStatus={handleToggleStatus}
        onToggleChannel={handleToggleChannel}
        onToggleAllStatuses={handleToggleAllStatuses}
        onToggleAllChannels={handleToggleAllChannels}
        onApplyDateRange={applyDateRange}
        onApplyDatePreset={applyDatePreset}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />

      <NoticesDataTable
        rows={rows}
        meta={meta}
        loading={loading}
        refreshing={refreshing}
        error={error}
        highlightedRowId={highlightedRowId}
        sortState={sortState}
        perPage={perPage}
        onToggleSort={handleToggleSort}
        onRefresh={() => void fetchNotices(true)}
        onGoPage={setPage}
        onPerPageChange={handlePerPageChange}
        onRowClick={(row) => {
          const returnTo = buildReturnToPath();
          router.push(`/notices/${row.id}?returnTo=${encodeURIComponent(returnTo)}`);
        }}
      />
    </div>
  );
}
