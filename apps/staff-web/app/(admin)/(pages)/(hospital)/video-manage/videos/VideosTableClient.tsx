"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { isApiSuccess } from "@beaulab/types";
import { type DataTableMeta } from "@beaulab/ui-admin";

import { VideosDataTable } from "@/components/video/list/VideosDataTable";
import { VideosFilterPanel } from "@/components/video/list/VideosFilterPanel";
import { useListData } from "@/hooks/common/useListData";
import { api } from "@/lib/common/api";
import { CATEGORY_DOMAINS, type CategoryApiItem } from "@/lib/common/category";
import {
  DEFAULT_FILTERS,
  VIDEO_CATEGORY_USAGES,
  VIDEO_REPORT_STATUS_OPTIONS,
  buildPresetDateRange,
  buildVideosQuery,
  buildVideosReturnToPath,
  buildVideosQueryString,
  mapDateRangeToFilter,
  nextSortState,
  normalizeNumberBound,
  normalizeRangeDate,
  normalizeVideo,
  parseVideosTableState,
  type DatePresetKey,
  type Filters,
  type SortField,
  type SortState,
  type VideoApiItem,
  type VideoMetric,
} from "@/lib/video/list";

type SelectOption = {
  value: string;
  label: string;
};

const CATEGORY_ITEMS_CACHE_TTL_MS = 5 * 60 * 1000;
const categoryItemsCache = new Map<string, { expiresAt: number; items: CategoryApiItem[] }>();

function buildCategoryItemsCacheKey(params: Record<string, string | number>) {
  return Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
}

function cloneDefaultFilters(): Filters {
  return {
    ...DEFAULT_FILTERS,
    reportStatuses: [...DEFAULT_FILTERS.reportStatuses],
  };
}

function cloneFilters(filters: Filters): Filters {
  return {
    ...filters,
    reportStatuses: [...filters.reportStatuses],
  };
}

export default function VideosTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [initialTableState] = React.useState(() => parseVideosTableState(new URLSearchParams(searchParams.toString())));

  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [draftFilters, setDraftFilters] = React.useState<Filters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(initialTableState.filters);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [isReportStatusDropdownOpen, setIsReportStatusDropdownOpen] = React.useState(false);
  const [sortState, setSortState] = React.useState<SortState>(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);
  const [categoryItems, setCategoryItems] = React.useState<CategoryApiItem[]>([]);
  const [highlightedRowId, setHighlightedRowId] = React.useState<number | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);
  const reportStatusDropdownRef = React.useRef<HTMLDivElement | null>(null);

  const query = React.useMemo(
    () =>
      buildVideosQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        page,
      }),
    [appliedFilters, page, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildVideosQueryString(query), [query]);
  const buildReturnToPath = React.useCallback(() => buildVideosReturnToPath(pathname, query), [pathname, query]);

  const categoryOptions = React.useMemo<SelectOption[]>(
    () => [
      { value: "", label: "전체" },
      ...categoryItems.map((item) => ({
        value: String(item.id),
        label: item.full_path?.trim() || item.name,
      })),
    ],
    [categoryItems],
  );

  const fetchVideoRows = React.useCallback(async (nextQuery: typeof query) => {
    const response = await api.get<VideoApiItem[]>("/videos", nextQuery, {
      latestKey: "videos:list",
    });
    if (!isApiSuccess(response)) {
      throw new Error(response.error.message || "동영상 목록 조회에 실패했습니다.");
    }

    return {
      rows: response.data.map(normalizeVideo),
      meta: (response.meta as DataTableMeta | null) ?? null,
    };
  }, []);

  const {
    rows,
    meta,
    error,
    loading,
    refreshing,
    fetchList: fetchVideos,
  } = useListData({
    query,
    fetchRows: fetchVideoRows,
    errorMessage: "동영상 목록 조회 중 오류가 발생했습니다.",
  });

  const fetchCategoryItems = React.useCallback(
    async (params: Record<string, string | number>): Promise<CategoryApiItem[]> => {
      const queryParams = {
        domain: CATEGORY_DOMAINS.HOSPITAL_MEDICAL,
        status: "ACTIVE",
        per_page: 100,
        ...params,
      };
      const cacheKey = buildCategoryItemsCacheKey(queryParams);
      const cachedItems = categoryItemsCache.get(cacheKey);

      if (cachedItems && cachedItems.expiresAt > Date.now()) {
        return cachedItems.items;
      }

      const response = await api.get<CategoryApiItem[]>("/categories/selector", queryParams);

      if (!isApiSuccess(response)) {
        throw new Error(response.error.message || "카테고리 필터를 불러오지 못했습니다.");
      }

      categoryItemsCache.set(cacheKey, {
        expiresAt: Date.now() + CATEGORY_ITEMS_CACHE_TTL_MS,
        items: response.data,
      });

      return response.data;
    },
    [],
  );

  const loadCategories = React.useCallback(async () => {
    try {
      const groupedItems = await Promise.all(VIDEO_CATEGORY_USAGES.map((usage) => fetchCategoryItems({ usage })));
      const uniqueItems = new Map<number, CategoryApiItem>();

      groupedItems.flat().forEach((item) => {
        uniqueItems.set(item.id, item);
      });

      setCategoryItems(Array.from(uniqueItems.values()));
    } catch {
      setCategoryItems([]);
    }
  }, [fetchCategoryItems]);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

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
    void loadCategories();
  }, [loadCategories]);

  React.useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!datePickerRef.current?.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
      if (!reportStatusDropdownRef.current?.contains(event.target as Node)) {
        setIsReportStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const applyFilters = React.useCallback(() => {
    setPage(1);
    setSearchKeyword(searchInput.trim());
    setAppliedFilters({
      ...cloneFilters(draftFilters),
      metricMin: normalizeNumberBound(draftFilters.metricMin),
      metricMax: normalizeNumberBound(draftFilters.metricMax),
    });
  }, [draftFilters, searchInput]);

  const resetFilters = React.useCallback(() => {
    const defaultFilters = cloneDefaultFilters();

    setPage(1);
    setSearchInput("");
    setSearchKeyword("");
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setDraftDateRange(undefined);
    setIsDatePickerOpen(false);
    setIsReportStatusDropdownOpen(false);
  }, []);

  const applyDateRange = React.useCallback((nextRange?: DateRange) => {
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
  }, []);

  const applyDatePreset = React.useCallback(
    (preset: DatePresetKey) => {
      applyDateRange(buildPresetDateRange(preset));
      setIsDatePickerOpen(false);
    },
    [applyDateRange],
  );

  const toggleReportStatus = React.useCallback((value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.reportStatuses.includes(value);

      return {
        ...prev,
        reportStatuses: exists ? prev.reportStatuses.filter((item) => item !== value) : [...prev.reportStatuses, value],
      };
    });
  }, []);

  const toggleAllReportStatus = React.useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      reportStatuses:
        prev.reportStatuses.length === VIDEO_REPORT_STATUS_OPTIONS.length
          ? []
          : VIDEO_REPORT_STATUS_OPTIONS.map((option) => option.value),
    }));
  }, []);

  const handleToggleSort = React.useCallback((field: SortField) => {
    setPage(1);
    setSortState((prev) => nextSortState(prev, field));
  }, []);

  const handleGoPage = React.useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  const handleRefresh = React.useCallback(() => {
    void fetchVideos(true);
  }, [fetchVideos]);

  return (
    <div className="min-w-0 space-y-4">
      <VideosFilterPanel
        searchInput={searchInput}
        draftFilters={draftFilters}
        draftDateRange={draftDateRange}
        categoryOptions={categoryOptions}
        isDatePickerOpen={isDatePickerOpen}
        isReportStatusDropdownOpen={isReportStatusDropdownOpen}
        datePickerRef={datePickerRef}
        reportStatusDropdownRef={reportStatusDropdownRef}
        onSearchChange={setSearchInput}
        onToggleDatePicker={() => {
          setIsReportStatusDropdownOpen(false);
          setIsDatePickerOpen((prev) => !prev);
        }}
        onToggleReportStatusDropdown={() => {
          setIsDatePickerOpen(false);
          setIsReportStatusDropdownOpen((prev) => !prev);
        }}
        onApplyDateRange={applyDateRange}
        onApplyDatePreset={applyDatePreset}
        onCategoryChange={(value) => setDraftFilters((prev) => ({ ...prev, categoryId: value }))}
        onHospitalStatusChange={(value) => setDraftFilters((prev) => ({ ...prev, hospitalStatus: value }))}
        onToggleReportStatus={toggleReportStatus}
        onToggleAllReportStatus={toggleAllReportStatus}
        onMetricChange={(value: VideoMetric) =>
          setDraftFilters((prev) => ({
            ...prev,
            metric: value,
            metricMin: value === "all" ? "" : prev.metricMin,
            metricMax: value === "all" ? "" : prev.metricMax,
          }))
        }
        onMetricMinChange={(value) => setDraftFilters((prev) => ({ ...prev, metricMin: value }))}
        onMetricMaxChange={(value) => setDraftFilters((prev) => ({ ...prev, metricMax: value }))}
        onAdminStatusChange={(value) => setDraftFilters((prev) => ({ ...prev, adminStatus: value }))}
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
        onToggleSort={handleToggleSort}
        onRefresh={handleRefresh}
        onGoPage={handleGoPage}
        onRowClick={(row) => {
          const returnTo = buildReturnToPath();
          router.push(`/video-manage/videos/${row.id}?returnTo=${encodeURIComponent(returnTo)}`);
        }}
      />
    </div>
  );
}
