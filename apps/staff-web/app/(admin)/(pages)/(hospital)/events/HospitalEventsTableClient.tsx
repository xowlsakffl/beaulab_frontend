"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  FormCheckbox,
  InputField,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import { HospitalEventsDataTable } from "@/components/hospital-event/list/HospitalEventsDataTable";
import { HospitalEventsFilterPanel } from "@/components/hospital-event/list/HospitalEventsFilterPanel";
import { HospitalEventsSummaryCards } from "@/components/hospital-event/list/HospitalEventsSummaryCards";
import { api, isApiRequestCanceledError } from "@/lib/common/api";
import { CATEGORY_DOMAINS, type CategoryApiItem } from "@/lib/common/category";
import { preloadImageUrls } from "@/lib/common/media";
import {
  DEFAULT_HOSPITAL_EVENT_FILTERS,
  HOSPITAL_EVENT_ALLOW_STATUS_OPTIONS,
  HOSPITAL_EVENT_CATEGORY_USAGES,
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

type PeriodEditState = {
  row: HospitalEventRow;
  eventStartAt: string;
  eventEndAt: string;
  isEventPeriodUnlimited: boolean;
  error: string | null;
};

export default function HospitalEventsTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTableStateRef = React.useRef<ReturnType<typeof parseHospitalEventsTableState> | null>(null);
  const requestKeyRef = React.useRef("");
  const hasFetchedRef = React.useRef(false);
  const middleCategoryParentRef = React.useRef("");

  if (!initialTableStateRef.current) {
    initialTableStateRef.current = parseHospitalEventsTableState(new URLSearchParams(searchParams.toString()));
  }

  const initialTableState = initialTableStateRef.current;
  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [isAllowStatusDropdownOpen, setIsAllowStatusDropdownOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftFilters, setDraftFilters] = React.useState<HospitalEventFilters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<HospitalEventFilters>(initialTableState.filters);
  const [sortState, setSortState] = React.useState<HospitalEventSortState>(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);
  const [rows, setRows] = React.useState<HospitalEventRow[]>([]);
  const [summary, setSummary] = React.useState<HospitalEventSummary | null>(null);
  const [majorCategoryItems, setMajorCategoryItems] = React.useState<CategoryApiItem[]>([]);
  const [middleCategoryItems, setMiddleCategoryItems] = React.useState<CategoryApiItem[]>([]);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [periodEdit, setPeriodEdit] = React.useState<PeriodEditState | null>(null);
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

  const majorCategoryOptions = React.useMemo<SelectOption[]>(() => [
    { value: "", label: "전체" },
    ...majorCategoryItems.map((item) => ({
      value: String(item.id),
      label: item.name,
    })),
  ], [majorCategoryItems]);

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

  const fetchEvents = React.useCallback(
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
        const response = await api.get<HospitalEventApiItem[]>("/hospital-events", query, {
          latestKey: "hospital-events:list",
        });
        if (!isApiSuccess(response)) {
          setError(response.error.message || "이벤트 목록 조회에 실패했습니다.");
          return;
        }

        const normalizedRows = response.data.map(normalizeHospitalEvent);
        await preloadImageUrls(normalizedRows.map((row) => row.thumbnailUrl));
        setRows(normalizedRows);
        setMeta((response.meta as DataTableMeta | null) ?? null);
        hasFetchedRef.current = true;
      } catch (error) {
        if (isApiRequestCanceledError(error)) {
          shouldFinalize = false;
          return;
        }

        setError("이벤트 목록 조회 중 오류가 발생했습니다.");
      } finally {
        if (shouldFinalize) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [query],
  );

  const fetchCategoryItems = React.useCallback(
    async (params: Record<string, string | number>): Promise<CategoryApiItem[]> => {
      const response = await api.get<CategoryApiItem[]>("/categories/selector", {
        domain: CATEGORY_DOMAINS.HOSPITAL_MEDICAL,
        status: "ACTIVE",
        per_page: 100,
        ...params,
      });

      if (!isApiSuccess(response)) {
        throw new Error(response.error.message || "카테고리 필터를 불러오지 못했습니다.");
      }

      return response.data;
    },
    [],
  );

  const loadMajorCategories = React.useCallback(async () => {
    try {
      const groupedItems = await Promise.all(
        HOSPITAL_EVENT_CATEGORY_USAGES.map((usage) => fetchCategoryItems({ usage })),
      );
      const uniqueItems = new Map<number, CategoryApiItem>();

      groupedItems.flat().forEach((item) => {
        uniqueItems.set(item.id, item);
      });

      setMajorCategoryItems(Array.from(uniqueItems.values()));
    } catch {
      setMajorCategoryItems([]);
    }
  }, [fetchCategoryItems]);

  const loadMiddleCategories = React.useCallback(
    async (parentId: string) => {
      middleCategoryParentRef.current = parentId;
      setMiddleCategoryItems([]);

      if (!parentId) return;

      try {
        const items = await fetchCategoryItems({ parent_id: parentId });
        if (middleCategoryParentRef.current === parentId) {
          setMiddleCategoryItems(items);
        }
      } catch {
        if (middleCategoryParentRef.current === parentId) {
          setMiddleCategoryItems([]);
        }
      }
    },
    [fetchCategoryItems],
  );

  React.useEffect(() => {
    fetchEvents(false);
  }, [fetchEvents]);

  React.useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  React.useEffect(() => {
    void loadMajorCategories();
  }, [loadMajorCategories]);

  React.useEffect(() => {
    if (!draftFilters.majorCategoryId) return;

    void loadMiddleCategories(draftFilters.majorCategoryId);
  }, [draftFilters.majorCategoryId, loadMiddleCategories]);

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
        allowStatuses: exists
          ? prev.allowStatuses.filter((item) => item !== value)
          : [...prev.allowStatuses, value],
      };
    });
  };

  const toggleAllAllowStatus = () => {
    setDraftFilters((prev) => ({
      ...prev,
      allowStatuses: prev.allowStatuses.length === HOSPITAL_EVENT_ALLOW_STATUS_OPTIONS.length
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

  const closePeriodEditModal = React.useCallback(() => {
    if (periodUpdating) return;
    setPeriodEdit(null);
  }, [periodUpdating]);

  const updatePeriodEdit = React.useCallback((patch: Partial<Omit<PeriodEditState, "row">>) => {
    setPeriodEdit((prev) => (prev ? { ...prev, ...patch, error: null } : prev));
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
      <HospitalEventsSummaryCards summary={summary} />

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
        onVisibilityChange={(value) => setDraftFilters((prev) => ({ ...prev, visibilityStatus: value }))}
        onMajorCategoryChange={(value) => {
          setDraftFilters((prev) => ({ ...prev, majorCategoryId: value, middleCategoryId: "" }));
          void loadMiddleCategories(value);
        }}
        onMiddleCategoryChange={(value) => setDraftFilters((prev) => ({ ...prev, middleCategoryId: value }))}
        onQuantityMetricChange={(value: HospitalEventQuantityMetric) => setDraftFilters((prev) => ({ ...prev, quantityMetric: value }))}
        onQuantityMinChange={(value) => setDraftFilters((prev) => ({ ...prev, quantityMin: value }))}
        onQuantityMaxChange={(value) => setDraftFilters((prev) => ({ ...prev, quantityMax: value }))}
        onAmountMetricChange={(value: HospitalEventAmountMetric) => setDraftFilters((prev) => ({ ...prev, amountMetric: value }))}
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
        sortState={sortState}
        onToggleSort={toggleSort}
        onEditPeriod={openPeriodEditModal}
        onRefresh={() => {
          void Promise.all([fetchEvents(true), fetchSummary()]);
        }}
        onGoPage={setPage}
      />

      <Modal isOpen={Boolean(periodEdit)} onClose={closePeriodEditModal} className="mx-4 w-full max-w-2xl" showCloseButton>
        <ModalPanel className="rounded-2xl p-6 shadow-none">
          <ModalHeader className="pr-12">
            <ModalTitle className="text-xl font-bold">이벤트 기간 수정</ModalTitle>
          </ModalHeader>

          <ModalBody className="mt-5 space-y-6">
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">
                이벤트 기간 <span className="text-error-500">*</span>
              </p>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] sm:items-center">
                <InputField
                  type="date"
                  value={periodEdit?.eventStartAt ?? ""}
                  onChange={(event) => updatePeriodEdit({ eventStartAt: event.target.value })}
                  error={Boolean(periodEdit?.error && !periodEdit.eventStartAt)}
                  className="h-11 bg-gray-50"
                />
                <span className="hidden text-center text-gray-400 sm:block">-</span>
                <InputField
                  type="date"
                  value={periodEdit?.isEventPeriodUnlimited ? "" : (periodEdit?.eventEndAt ?? "")}
                  min={periodEdit?.eventStartAt || undefined}
                  disabled={Boolean(periodEdit?.isEventPeriodUnlimited)}
                  onChange={(event) => updatePeriodEdit({ eventEndAt: event.target.value })}
                  error={Boolean(periodEdit?.error && periodEdit && !periodEdit.isEventPeriodUnlimited && !periodEdit.eventEndAt)}
                  className="h-11 bg-gray-50 disabled:bg-gray-100"
                />
                <div className="whitespace-nowrap">
                  <FormCheckbox
                    checked={Boolean(periodEdit?.isEventPeriodUnlimited)}
                    onChange={(checked) =>
                      updatePeriodEdit({
                        isEventPeriodUnlimited: checked,
                        eventEndAt: checked ? "" : (periodEdit?.eventEndAt ?? ""),
                      })
                    }
                    label="종료일 없음"
                  />
                </div>
              </div>
              {periodEdit?.error ? <p className="mt-2 text-sm font-medium text-error-500">{periodEdit.error}</p> : null}
            </div>
          </ModalBody>

          <ModalFooter className="mt-10 grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="h-12 w-full justify-center" disabled={periodUpdating} onClick={closePeriodEditModal}>
              취소
            </Button>
            <Button type="button" variant="brand" className="h-12 w-full justify-center" disabled={periodUpdating} onClick={() => void submitPeriodEdit()}>
              {periodUpdating ? "수정 중" : "수정하기"}
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>
    </div>
  );
}
