"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { isApiSuccess } from "@beaulab/types";
import { type DataTableMeta } from "@beaulab/ui-admin";

import { HospitalEventsDataTable } from "@/components/hospital-event/list/HospitalEventsDataTable";
import { HospitalEventsFilterPanel } from "@/components/hospital-event/list/HospitalEventsFilterPanel";
import {
  HospitalEventPeriodEditModal,
  type HospitalEventPeriodEditState,
} from "@/components/hospital-event/list/HospitalEventPeriodEditModal";
import {
  HospitalEventsSummaryCards,
  type HospitalEventSummaryCardKey,
} from "@/components/hospital-event/list/HospitalEventsSummaryCards";
import { useListData } from "@/hooks/common/useListData";
import { api, isApiRequestCanceledError } from "@/lib/common/api";
import type { CategoryApiItem } from "@/lib/common/category";
import { fetchHospitalEventCategoryFilterOptions } from "@/lib/hospital-event/category-filter-options";
import {
  DEFAULT_HOSPITAL_EVENT_FILTERS,
  HOSPITAL_EVENT_ALLOW_STATUS_OPTIONS,
  buildHospitalEventPresetDateRange,
  buildHospitalEventsQuery,
  buildHospitalEventsQueryString,
  mapDateRangeToHospitalEventFilter,
  nextHospitalEventSortState,
  normalizeHospitalEvent,
  normalizeNumberBound,
  normalizeRangeDate,
  parseHospitalEventsTableState,
  type HospitalEventAmountMetric,
  type HospitalEventApiItem,
  type HospitalEventDatePresetKey,
  type HospitalEventDateType,
  type HospitalEventFilters,
  type HospitalEventQuantityMetric,
  type HospitalEventRow,
  type HospitalEventSortField,
  type HospitalEventSortState,
  type HospitalEventSummary,
} from "@/lib/hospital-event/list";

type SelectOption = {
  value: string;
  label: string;
};

function cloneDefaultHospitalEventFilters(): HospitalEventFilters {
  return {
    ...DEFAULT_HOSPITAL_EVENT_FILTERS,
    dateTypes: [...DEFAULT_HOSPITAL_EVENT_FILTERS.dateTypes],
    allowStatuses: [...DEFAULT_HOSPITAL_EVENT_FILTERS.allowStatuses],
  };
}

function buildSummaryFilterState(key: HospitalEventSummaryCardKey): {
  filters: HospitalEventFilters;
  draftDateRange?: DateRange;
} {
  const filters = cloneDefaultHospitalEventFilters();

  if (key === "active") {
    return {
      filters: {
        ...filters,
        summaryFilter: key,
      },
    };
  }

  if (key === "ending_soon") {
    const from = normalizeRangeDate(new Date());
    const to = new Date(from);
    to.setDate(from.getDate() + 30);

    const draftDateRange = { from, to };
    const mappedDateRange = mapDateRangeToHospitalEventFilter(draftDateRange);

    return {
      draftDateRange,
      filters: {
        ...filters,
        summaryFilter: key,
        dateTypes: ["event_end_at"],
        dateRange: mappedDateRange.label,
        startDate: mappedDateRange.startDate,
        endDate: mappedDateRange.endDate,
      },
    };
  }

  if (key === "pending" || key === "reviewing" || key === "approved" || key === "rejected") {
    const allowStatusMap = {
      pending: "PENDING",
      reviewing: "REVIEWING",
      approved: "APPROVED",
      rejected: "REJECTED",
    } satisfies Record<typeof key, string>;

    return {
      filters: {
        ...filters,
        summaryFilter: key,
        allowStatuses: [allowStatusMap[key]],
      },
    };
  }

  return {
    filters: {
      ...filters,
      summaryFilter: key,
    },
  };
}

function resolveActiveSummaryKey(filters: HospitalEventFilters): HospitalEventSummaryCardKey | null {
  return filters.summaryFilter || null;
}

export default function HospitalEventsTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [initialTableState] = React.useState(() =>
    parseHospitalEventsTableState(new URLSearchParams(searchParams.toString())),
  );

  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [isAllowStatusDropdownOpen, setIsAllowStatusDropdownOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftFilters, setDraftFilters] = React.useState<HospitalEventFilters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<HospitalEventFilters>(initialTableState.filters);
  const [sortState, setSortState] = React.useState<HospitalEventSortState>(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);
  const [summary, setSummary] = React.useState<HospitalEventSummary | null>(null);
  const [majorCategoryItems, setMajorCategoryItems] = React.useState<CategoryApiItem[]>([]);
  const [middleCategoryItemsByParent, setMiddleCategoryItemsByParent] = React.useState<
    Record<string, CategoryApiItem[]>
  >({});
  const [highlightedRowId, setHighlightedRowId] = React.useState<number | null>(null);
  const [periodEdit, setPeriodEdit] = React.useState<HospitalEventPeriodEditState | null>(null);
  const [periodUpdating, setPeriodUpdating] = React.useState(false);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);
  const allowStatusDropdownRef = React.useRef<HTMLDivElement | null>(null);

  const query = React.useMemo(
    () =>
      buildHospitalEventsQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        page,
      }),
    [appliedFilters, page, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildHospitalEventsQueryString(query), [query]);
  const activeSummaryKey = React.useMemo(() => resolveActiveSummaryKey(appliedFilters), [appliedFilters]);
  const fetchEventRows = React.useCallback(async (nextQuery: typeof query) => {
    const response = await api.get<HospitalEventApiItem[]>("/hospital-events", nextQuery, {
      latestKey: "hospital-events:list",
    });
    if (!isApiSuccess(response)) {
      throw new Error(response.error.message || "이벤트 목록 조회에 실패했습니다.");
    }

    return {
      rows: response.data.map(normalizeHospitalEvent),
      meta: (response.meta as DataTableMeta | null) ?? null,
    };
  }, []);

  const {
    rows,
    meta,
    error,
    loading,
    refreshing,
    fetchList: fetchEvents,
  } = useListData({
    query,
    fetchRows: fetchEventRows,
    errorMessage: "이벤트 목록 조회 중 오류가 발생했습니다.",
  });

  const fetchSummary = React.useCallback(async () => {
    try {
      const response = await api.get<HospitalEventSummary>("/hospital-events/summary", undefined, {
        latestKey: "hospital-events:summary",
      });

      if (!isApiSuccess(response)) {
        return;
      }

      setSummary(response.data);
    } catch (error) {
      if (isApiRequestCanceledError(error)) return;

      setSummary(null);
    }
  }, []);

  const majorCategoryOptions = React.useMemo<SelectOption[]>(
    () => [
      { value: "", label: "전체" },
      ...majorCategoryItems.map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    ],
    [majorCategoryItems],
  );

  const middleCategoryItems = React.useMemo(
    () => middleCategoryItemsByParent[draftFilters.majorCategoryId] ?? [],
    [draftFilters.majorCategoryId, middleCategoryItemsByParent],
  );

  const middleCategoryOptions = React.useMemo<SelectOption[]>(() => {
    if (!draftFilters.majorCategoryId) return [{ value: "", label: "대분류 선택" }];

    return [
      { value: "", label: "전체" },
      ...middleCategoryItems.map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    ];
  }, [draftFilters.majorCategoryId, middleCategoryItems]);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  const loadCategoryFilterOptions = React.useCallback(async () => {
    try {
      const options = await fetchHospitalEventCategoryFilterOptions();

      setMajorCategoryItems(options.major_categories);
      setMiddleCategoryItemsByParent(options.middle_categories_by_parent);
    } catch {
      setMajorCategoryItems([]);
      setMiddleCategoryItemsByParent({});
    }
  }, []);

  React.useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

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
    void loadCategoryFilterOptions();
  }, [loadCategoryFilterOptions]);

  React.useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!datePickerRef.current?.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
      if (!allowStatusDropdownRef.current?.contains(event.target as Node)) {
        setIsAllowStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const applyFilters = () => {
    setPage(1);
    setSearchKeyword(searchInput.trim());
    setAppliedFilters({
      ...draftFilters,
      quantityMin: normalizeNumberBound(draftFilters.quantityMin),
      quantityMax: normalizeNumberBound(draftFilters.quantityMax),
      amountMin: normalizeNumberBound(draftFilters.amountMin),
      amountMax: normalizeNumberBound(draftFilters.amountMax),
    });
  };

  const resetFilters = () => {
    setDraftFilters(DEFAULT_HOSPITAL_EVENT_FILTERS);
    setAppliedFilters(DEFAULT_HOSPITAL_EVENT_FILTERS);
    setDraftDateRange(undefined);
    setSearchInput("");
    setSearchKeyword("");
    setPage(1);
    setIsDatePickerOpen(false);
    setIsAllowStatusDropdownOpen(false);
  };

  const applySummaryFilter = React.useCallback(
    (key: HospitalEventSummaryCardKey) => {
      const nextState =
        activeSummaryKey === key
          ? { filters: DEFAULT_HOSPITAL_EVENT_FILTERS, draftDateRange: undefined }
          : buildSummaryFilterState(key);

      setDraftFilters(nextState.filters);
      setAppliedFilters(nextState.filters);
      setDraftDateRange(nextState.draftDateRange);
      setSearchInput("");
      setSearchKeyword("");
      setPage(1);
      setIsDatePickerOpen(false);
      setIsAllowStatusDropdownOpen(false);
    },
    [activeSummaryKey],
  );

  const toggleDateType = (value: HospitalEventDateType) => {
    setDraftFilters((prev) => ({
      ...prev,
      dateTypes: [value],
    }));
  };

  const toggleAllowStatus = (value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.allowStatuses.includes(value);

      return {
        ...prev,
        allowStatuses: exists ? prev.allowStatuses.filter((item) => item !== value) : [...prev.allowStatuses, value],
      };
    });
  };

  const toggleAllAllowStatus = () => {
    setDraftFilters((prev) => ({
      ...prev,
      allowStatuses:
        prev.allowStatuses.length === HOSPITAL_EVENT_ALLOW_STATUS_OPTIONS.length
          ? []
          : HOSPITAL_EVENT_ALLOW_STATUS_OPTIONS.map((option) => option.value),
    }));
  };

  const applyDateRange = (nextRange?: DateRange) => {
    const normalizedRange =
      nextRange?.from || nextRange?.to
        ? {
            from: nextRange?.from ? normalizeRangeDate(nextRange.from) : undefined,
            to: nextRange?.to ? normalizeRangeDate(nextRange.to) : undefined,
          }
        : undefined;
    const mapped = mapDateRangeToHospitalEventFilter(normalizedRange);

    setDraftDateRange(normalizedRange);
    setDraftFilters((prev) => ({
      ...prev,
      dateRange: mapped.label,
      startDate: mapped.startDate,
      endDate: mapped.endDate,
    }));
  };

  const applyDatePreset = (preset: HospitalEventDatePresetKey) => {
    applyDateRange(buildHospitalEventPresetDateRange(preset));
    setIsDatePickerOpen(false);
  };

  const toggleSort = React.useCallback((field: HospitalEventSortField) => {
    setPage(1);
    setSortState((prev) => nextHospitalEventSortState(prev, field));
  }, []);

  const openPeriodEditModal = React.useCallback((row: HospitalEventRow) => {
    setPeriodEdit({
      row,
      eventStartAt: row.eventStartAt,
      eventEndAt: row.eventEndAt,
      isEventPeriodUnlimited: row.isEventPeriodUnlimited,
      error: null,
    });
  }, []);

  const openEventDetailPage = React.useCallback(
    (row: HospitalEventRow) => {
      const returnTo = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(`/ads-manage/events/${row.id}?returnTo=${encodeURIComponent(returnTo)}`);
    },
    [pathname, queryString, router],
  );

  const duplicateEvent = React.useCallback(
    (row: HospitalEventRow) => {
      const returnTo = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(`/ads-manage/events/new?copyFrom=${row.id}&returnTo=${encodeURIComponent(returnTo)}`);
    },
    [pathname, queryString, router],
  );

  const openEventDBPage = React.useCallback(
    (row: HospitalEventRow) => {
      router.push(`/customer-db-manage/events?hospital_event_id=${row.id}`);
    },
    [router],
  );

  const closePeriodEditModal = React.useCallback(() => {
    if (periodUpdating) return;
    setPeriodEdit(null);
  }, [periodUpdating]);

  const updatePeriodEdit = React.useCallback((patch: Partial<Omit<HospitalEventPeriodEditState, "row">>) => {
    setPeriodEdit((prev) => (prev ? { ...prev, error: null, ...patch } : prev));
  }, []);

  const submitPeriodEdit = React.useCallback(async () => {
    if (!periodEdit || periodUpdating) return;

    const eventStartAt = periodEdit.eventStartAt.trim();
    const eventEndAt = periodEdit.eventEndAt.trim();

    if (!eventStartAt) {
      updatePeriodEdit({ error: "시작일을 선택해주세요." });
      return;
    }

    if (!periodEdit.isEventPeriodUnlimited && !eventEndAt) {
      updatePeriodEdit({ error: "종료일을 선택해주세요." });
      return;
    }

    if (!periodEdit.isEventPeriodUnlimited && eventEndAt < eventStartAt) {
      updatePeriodEdit({ error: "종료일은 시작일보다 빠를 수 없습니다." });
      return;
    }

    setPeriodUpdating(true);

    try {
      const response = await api.patch<HospitalEventApiItem>(`/hospital-events/${periodEdit.row.id}/period`, {
        event_start_at: eventStartAt,
        event_end_at: periodEdit.isEventPeriodUnlimited ? null : eventEndAt,
        is_event_period_unlimited: periodEdit.isEventPeriodUnlimited,
      });

      if (!isApiSuccess(response)) {
        updatePeriodEdit({ error: response.error.message || "이벤트 기간 수정에 실패했습니다." });
        return;
      }

      setHighlightedRowId(periodEdit.row.id);
      setPeriodEdit(null);
      await Promise.all([fetchEvents(true), fetchSummary()]);
    } catch (error) {
      if (isApiRequestCanceledError(error)) return;

      updatePeriodEdit({ error: "이벤트 기간 수정 중 오류가 발생했습니다." });
    } finally {
      setPeriodUpdating(false);
    }
  }, [fetchEvents, fetchSummary, periodEdit, periodUpdating, updatePeriodEdit]);

  return (
    <div className="min-w-0 space-y-4">
      <HospitalEventsSummaryCards summary={summary} activeKey={activeSummaryKey} onSelect={applySummaryFilter} />

      <HospitalEventsFilterPanel
        searchInput={searchInput}
        draftFilters={draftFilters}
        draftDateRange={draftDateRange}
        majorCategoryOptions={majorCategoryOptions}
        middleCategoryOptions={middleCategoryOptions}
        isDatePickerOpen={isDatePickerOpen}
        isAllowStatusDropdownOpen={isAllowStatusDropdownOpen}
        datePickerRef={datePickerRef}
        allowStatusDropdownRef={allowStatusDropdownRef}
        onSearchChange={setSearchInput}
        onToggleDatePicker={() => setIsDatePickerOpen((prev) => !prev)}
        onToggleAllowStatusDropdown={() => setIsAllowStatusDropdownOpen((prev) => !prev)}
        onToggleDateType={toggleDateType}
        onToggleAllowStatus={toggleAllowStatus}
        onToggleAllAllowStatus={toggleAllAllowStatus}
        onApplyDateRange={applyDateRange}
        onApplyDatePreset={applyDatePreset}
        onAdminStatusChange={(value) => setDraftFilters((prev) => ({ ...prev, adminStatus: value }))}
        onMajorCategoryChange={(value) => {
          setDraftFilters((prev) => ({ ...prev, majorCategoryId: value, middleCategoryId: "" }));
        }}
        onMiddleCategoryChange={(value) => setDraftFilters((prev) => ({ ...prev, middleCategoryId: value }))}
        onQuantityMetricChange={(value: HospitalEventQuantityMetric) =>
          setDraftFilters((prev) => ({ ...prev, quantityMetric: value }))
        }
        onQuantityMinChange={(value) => setDraftFilters((prev) => ({ ...prev, quantityMin: value }))}
        onQuantityMaxChange={(value) => setDraftFilters((prev) => ({ ...prev, quantityMax: value }))}
        onAmountMetricChange={(value: HospitalEventAmountMetric) =>
          setDraftFilters((prev) => ({ ...prev, amountMetric: value }))
        }
        onAmountMinChange={(value) => setDraftFilters((prev) => ({ ...prev, amountMin: value }))}
        onAmountMaxChange={(value) => setDraftFilters((prev) => ({ ...prev, amountMax: value }))}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />

      <HospitalEventsDataTable
        rows={rows}
        meta={meta}
        loading={loading}
        refreshing={refreshing}
        error={error}
        highlightedRowId={highlightedRowId}
        sortState={sortState}
        onToggleSort={toggleSort}
        onEditPeriod={openPeriodEditModal}
        onDuplicate={duplicateEvent}
        onOpenConsultations={openEventDBPage}
        onOpenDetail={openEventDetailPage}
        onRefresh={() => {
          void Promise.all([fetchEvents(true), fetchSummary()]);
        }}
        onGoPage={setPage}
      />

      <HospitalEventPeriodEditModal
        periodEdit={periodEdit}
        updating={periodUpdating}
        onClose={closePeriodEditModal}
        onChange={updatePeriodEdit}
        onSubmit={submitPeriodEdit}
      />
    </div>
  );
}
