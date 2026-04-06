"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin";

import { VideosDataTable } from "@/components/video/list/VideosDataTable";
import { VideosFilterPanel } from "@/components/video/list/VideosFilterPanel";
import { api } from "@/lib/common/api";
import {
  DATE_PRESET_OPTIONS,
  DEFAULT_FILTERS,
  VIDEO_APPROVAL_STATUS_OPTIONS,
  VIDEO_DISTRIBUTION_CHANNEL_OPTIONS,
  VIDEO_STATUS_OPTIONS,
  buildPresetDateRange,
  buildVideosQuery,
  buildVideosReturnToPath,
  buildVideosQueryString,
  mapDateRangeToFilter,
  nextSortState,
  normalizeRangeDate,
  normalizeVideo,
  parseVideosTableState,
  type DateFilterKey,
  type DatePresetKey,
  type Filters,
  type SortField,
  type SortState,
  type VideoApiItem,
} from "@/lib/video/list";

export default function VideosTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTableStateRef = React.useRef<ReturnType<typeof parseVideosTableState> | null>(null);

  if (!initialTableStateRef.current) {
    initialTableStateRef.current = parseVideosTableState(new URLSearchParams(searchParams.toString()));
  }

  const initialTableState = initialTableStateRef.current;

  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [draftFilters, setDraftFilters] = React.useState<Filters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(initialTableState.filters);
  const [isOperatingStatusDropdownOpen, setIsOperatingStatusDropdownOpen] = React.useState(false);
  const [isApprovalStatusDropdownOpen, setIsApprovalStatusDropdownOpen] = React.useState(false);
  const [isDistributionChannelDropdownOpen, setIsDistributionChannelDropdownOpen] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [isAllowedDatePickerOpen, setIsAllowedDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftAllowedDateRange, setDraftAllowedDateRange] = React.useState<DateRange | undefined>(
    initialTableState.draftAllowedDateRange,
  );
  const operatingStatusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const approvalStatusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const distributionChannelDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);
  const allowedDatePickerRef = React.useRef<HTMLDivElement | null>(null);

  const [sortState, setSortState] = React.useState<SortState>(initialTableState.sortState);
  const [perPage, setPerPage] = React.useState(initialTableState.perPage);
  const [page, setPage] = React.useState(initialTableState.page);

  const [rows, setRows] = React.useState<ReturnType<typeof normalizeVideo>[]>([]);
  const [highlightedRowId, setHighlightedRowId] = React.useState<number | null>(null);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const requestKeyRef = React.useRef("");
  const hasFetchedRef = React.useRef(false);

  const query = React.useMemo(
    () =>
      buildVideosQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        perPage,
        page,
      }),
    [appliedFilters, page, perPage, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildVideosQueryString(query), [query]);
  const buildReturnToPath = React.useCallback(() => buildVideosReturnToPath(pathname, query), [pathname, query]);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  const fetchVideos = React.useCallback(
    async (manualRefresh = false) => {
      const requestKey = JSON.stringify(query);
      if (!manualRefresh && requestKeyRef.current === requestKey) return;
      requestKeyRef.current = requestKey;

      if (!hasFetchedRef.current) setLoading(true);
      else setRefreshing(true);
      if (manualRefresh) setRefreshing(true);

      setError(null);

      try {
        const response = await api.get<VideoApiItem[]>("/videos", query);
        if (!isApiSuccess(response)) {
          setError(response.error.message || "동영상 목록 조회에 실패했습니다.");
          return;
        }

        const responseMeta = (response.meta as DataTableMeta | null) ?? null;

        setRows(response.data.map(normalizeVideo));
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
        setError("동영상 목록 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [query],
  );

  React.useEffect(() => {
    fetchVideos(false);
  }, [fetchVideos]);

  React.useEffect(() => {
    rows.slice(0, 15).forEach((row) => {
      router.prefetch(`/videos/${row.id}`);
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
      if (!operatingStatusDropdownRef.current?.contains(event.target as Node)) {
        setIsOperatingStatusDropdownOpen(false);
      }

      if (!approvalStatusDropdownRef.current?.contains(event.target as Node)) {
        setIsApprovalStatusDropdownOpen(false);
      }

      if (!distributionChannelDropdownRef.current?.contains(event.target as Node)) {
        setIsDistributionChannelDropdownOpen(false);
      }

      if (!datePickerRef.current?.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }

      if (!allowedDatePickerRef.current?.contains(event.target as Node)) {
        setIsAllowedDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const applyFilters = React.useCallback(() => {
    setPage(1);
    setSearchKeyword(searchInput.trim());
    setAppliedFilters({
      operatingStatuses: [...draftFilters.operatingStatuses],
      approvalStatuses: [...draftFilters.approvalStatuses],
      distributionChannels: [...draftFilters.distributionChannels],
      dateRange: draftFilters.dateRange,
      startDate: draftFilters.startDate,
      endDate: draftFilters.endDate,
      allowedDateRange: draftFilters.allowedDateRange,
      allowedStartDate: draftFilters.allowedStartDate,
      allowedEndDate: draftFilters.allowedEndDate,
    });
  }, [draftFilters, searchInput]);

  const resetFilters = React.useCallback(() => {
    setPage(1);
    setSearchInput("");
    setSearchKeyword("");
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setDraftDateRange(undefined);
    setDraftAllowedDateRange(undefined);
    setIsOperatingStatusDropdownOpen(false);
    setIsApprovalStatusDropdownOpen(false);
    setIsDistributionChannelDropdownOpen(false);
    setIsDatePickerOpen(false);
    setIsAllowedDatePickerOpen(false);
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

        if (options?.closePicker) {
          setIsDatePickerOpen(false);
        }

        return;
      }

      setDraftAllowedDateRange(normalizedRange);
      setDraftFilters((prev) => ({
        ...prev,
        allowedDateRange: mapped.label,
        allowedStartDate: mapped.startDate,
        allowedEndDate: mapped.endDate,
      }));

      if (options?.closePicker) {
        setIsAllowedDatePickerOpen(false);
      }
    },
    [],
  );

  const applyDatePreset = React.useCallback((key: DateFilterKey, preset: DatePresetKey) => {
    const range = buildPresetDateRange(preset);
    applyDateRange(key, range, { closePicker: true });
  }, [applyDateRange]);

  const toggleOperatingStatus = React.useCallback((value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      operatingStatuses: prev.operatingStatuses.includes(value)
        ? prev.operatingStatuses.filter((item) => item !== value)
        : [...prev.operatingStatuses, value],
    }));
  }, []);

  const toggleApprovalStatus = React.useCallback((value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      approvalStatuses: prev.approvalStatuses.includes(value)
        ? prev.approvalStatuses.filter((item) => item !== value)
        : [...prev.approvalStatuses, value],
    }));
  }, []);

  const toggleDistributionChannel = React.useCallback((value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      distributionChannels: prev.distributionChannels.includes(value)
        ? prev.distributionChannels.filter((item) => item !== value)
        : [...prev.distributionChannels, value],
    }));
  }, []);

  const toggleAllOperatingStatuses = React.useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      operatingStatuses:
        prev.operatingStatuses.length === VIDEO_STATUS_OPTIONS.length
          ? []
          : VIDEO_STATUS_OPTIONS.map((option) => option.value),
    }));
  }, []);

  const toggleAllApprovalStatuses = React.useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      approvalStatuses:
        prev.approvalStatuses.length === VIDEO_APPROVAL_STATUS_OPTIONS.length
          ? []
          : VIDEO_APPROVAL_STATUS_OPTIONS.map((option) => option.value),
    }));
  }, []);

  const toggleAllDistributionChannels = React.useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      distributionChannels:
        prev.distributionChannels.length === VIDEO_DISTRIBUTION_CHANNEL_OPTIONS.length
          ? []
          : VIDEO_DISTRIBUTION_CHANNEL_OPTIONS.map((option) => option.value),
    }));
  }, []);

  const handleToggleSort = React.useCallback((field: SortField) => {
    setPage(1);
    setSortState((prev) => nextSortState(prev, field));
  }, []);

  const handleGoPage = React.useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  const handlePerPageChange = React.useCallback((value: number) => {
    setPerPage(value);
    setPage(1);
  }, []);

  const handleRefresh = React.useCallback(() => {
    void fetchVideos(true);
  }, [fetchVideos]);

  return (
    <div className="min-w-0 space-y-4">
      <VideosFilterPanel
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        draftFilters={draftFilters}
        draftDateRange={draftDateRange}
        draftAllowedDateRange={draftAllowedDateRange}
        isOperatingStatusDropdownOpen={isOperatingStatusDropdownOpen}
        isApprovalStatusDropdownOpen={isApprovalStatusDropdownOpen}
        isDistributionChannelDropdownOpen={isDistributionChannelDropdownOpen}
        isDatePickerOpen={isDatePickerOpen}
        isAllowedDatePickerOpen={isAllowedDatePickerOpen}
        operatingStatusDropdownRef={operatingStatusDropdownRef}
        approvalStatusDropdownRef={approvalStatusDropdownRef}
        distributionChannelDropdownRef={distributionChannelDropdownRef}
        datePickerRef={datePickerRef}
        allowedDatePickerRef={allowedDatePickerRef}
        operatingStatusOptions={VIDEO_STATUS_OPTIONS}
        approvalStatusOptions={VIDEO_APPROVAL_STATUS_OPTIONS}
        distributionChannelOptions={VIDEO_DISTRIBUTION_CHANNEL_OPTIONS}
        datePresetOptions={DATE_PRESET_OPTIONS}
        onToggleOperatingStatusDropdown={() => {
          setIsApprovalStatusDropdownOpen(false);
          setIsDistributionChannelDropdownOpen(false);
          setIsDatePickerOpen(false);
          setIsAllowedDatePickerOpen(false);
          setIsOperatingStatusDropdownOpen((prev) => !prev);
        }}
        onToggleApprovalStatusDropdown={() => {
          setIsOperatingStatusDropdownOpen(false);
          setIsDistributionChannelDropdownOpen(false);
          setIsDatePickerOpen(false);
          setIsAllowedDatePickerOpen(false);
          setIsApprovalStatusDropdownOpen((prev) => !prev);
        }}
        onToggleDistributionChannelDropdown={() => {
          setIsOperatingStatusDropdownOpen(false);
          setIsApprovalStatusDropdownOpen(false);
          setIsDatePickerOpen(false);
          setIsAllowedDatePickerOpen(false);
          setIsDistributionChannelDropdownOpen((prev) => !prev);
        }}
        onToggleDatePicker={() => {
          setIsOperatingStatusDropdownOpen(false);
          setIsApprovalStatusDropdownOpen(false);
          setIsDistributionChannelDropdownOpen(false);
          setIsAllowedDatePickerOpen(false);
          setIsDatePickerOpen((prev) => !prev);
        }}
        onToggleAllowedDatePicker={() => {
          setIsOperatingStatusDropdownOpen(false);
          setIsApprovalStatusDropdownOpen(false);
          setIsDistributionChannelDropdownOpen(false);
          setIsDatePickerOpen(false);
          setIsAllowedDatePickerOpen((prev) => !prev);
        }}
        onToggleOperatingStatus={toggleOperatingStatus}
        onToggleApprovalStatus={toggleApprovalStatus}
        onToggleDistributionChannel={toggleDistributionChannel}
        onToggleAllOperatingStatus={toggleAllOperatingStatuses}
        onToggleAllApprovalStatus={toggleAllApprovalStatuses}
        onToggleAllDistributionChannel={toggleAllDistributionChannels}
        onApplyDateRange={applyDateRange}
        onApplyDatePreset={applyDatePreset}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />

      <VideosDataTable
        rows={rows}
        meta={meta}
        loading={loading}
        refreshing={refreshing}
        error={error}
        highlightedRowId={highlightedRowId}
        sortState={sortState}
        perPage={perPage}
        onToggleSort={handleToggleSort}
        onRefresh={handleRefresh}
        onGoPage={handleGoPage}
        onPerPageChange={handlePerPageChange}
        onRowClick={(row) => {
          const returnTo = buildReturnToPath();
          router.push(`/videos/${row.id}?returnTo=${encodeURIComponent(returnTo)}`);
        }}
      />
    </div>
  );
}
