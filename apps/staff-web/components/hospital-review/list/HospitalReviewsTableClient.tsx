"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  InputField,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  type CheckboxFilterOption,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import { HospitalReviewsDataTable } from "@/components/hospital-review/list/HospitalReviewsDataTable";
import { HospitalReviewsFilterPanel } from "@/components/hospital-review/list/HospitalReviewsFilterPanel";
import { api } from "@/lib/common/api";
import type { CategoryApiItem } from "@/lib/common/category";
import {
  DEFAULT_HOSPITAL_REVIEW_FILTERS,
  DEFAULT_HOSPITAL_REVIEW_SORT,
  HOSPITAL_REVIEW_BOARD_CONFIGS,
  HOSPITAL_REVIEW_POST_STATUS_OPTIONS,
  HOSPITAL_REVIEW_RATING_OPTIONS,
  buildHospitalReviewPresetDateRange,
  buildHospitalReviewsQuery,
  buildHospitalReviewsQueryString,
  mapDateRangeToHospitalReviewFilter,
  nextHospitalReviewSortState,
  normalizeHospitalReview,
  normalizeMetricBound,
  parseHospitalReviewsTableState,
  type HospitalReviewApiItem,
  type HospitalReviewBoardType,
  type HospitalReviewFilters,
  type HospitalReviewMetricField,
  type HospitalReviewRow,
  type HospitalReviewSortField,
  type HospitalReviewSortState,
  type HospitalReviewDatePresetKey,
} from "@/lib/hospital-review/list";

type HospitalReviewVisibilityUpdateResponse = {
  updated_count: number;
  status: string;
  ids: number[];
};

type HospitalReviewVisibilityUpdatePayload = {
  ids: number[];
  status: "ACTIVE" | "INACTIVE";
  hidden_reason?: string;
};

type PendingVisibilityChange = {
  source: "bulk" | "row";
  ids: number[];
  status: "ACTIVE" | "INACTIVE";
  hiddenReason?: string;
} | null;

type HospitalReviewsTableClientProps = {
  type: HospitalReviewBoardType;
};

type SelectOption = {
  value: string;
  label: string;
};

export function HospitalReviewsTableClient({ type }: HospitalReviewsTableClientProps) {
  const config = HOSPITAL_REVIEW_BOARD_CONFIGS[type];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTableStateRef = React.useRef<ReturnType<typeof parseHospitalReviewsTableState> | null>(null);
  const hasFetchedRef = React.useRef(false);
  const requestKeyRef = React.useRef("");

  if (!initialTableStateRef.current) {
    initialTableStateRef.current = parseHospitalReviewsTableState(new URLSearchParams(searchParams.toString()));
  }

  const initialTableState = initialTableStateRef.current;
  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = React.useState(false);
  const [isRatingDropdownOpen, setIsRatingDropdownOpen] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftFilters, setDraftFilters] = React.useState<HospitalReviewFilters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<HospitalReviewFilters>(initialTableState.filters);
  const [sortState, setSortState] = React.useState<HospitalReviewSortState>(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);
  const [rows, setRows] = React.useState<HospitalReviewRow[]>([]);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [bulkUpdating, setBulkUpdating] = React.useState(false);
  const [majorCategoryItems, setMajorCategoryItems] = React.useState<CategoryApiItem[]>([]);
  const [middleCategoryItems, setMiddleCategoryItems] = React.useState<CategoryApiItem[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(() => new Set());
  const [rowVisibilityUpdatingIds, setRowVisibilityUpdatingIds] = React.useState<Set<number>>(() => new Set());
  const [pendingVisibilityChange, setPendingVisibilityChange] = React.useState<PendingVisibilityChange>(null);
  const statusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const ratingDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);

  const query = React.useMemo(
    () =>
      buildHospitalReviewsQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        page,
      }),
    [appliedFilters, page, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildHospitalReviewsQueryString(query), [query]);
  const majorCategoryOptions = React.useMemo<SelectOption[]>(() => [
    { value: "", label: "전체" },
    ...majorCategoryItems.map((item) => ({
      value: String(item.id),
      label: item.name,
    })),
  ], [majorCategoryItems]);
  const middleCategoryOptions = React.useMemo<SelectOption[]>(() => {
    if (!draftFilters.majorCategoryId) {
      return [{ value: "", label: "대분류 선택" }];
    }

    const selectedMajorId = Number(draftFilters.majorCategoryId);
    const filteredItems = middleCategoryItems
      .filter((item) => item.parent_id === selectedMajorId);

    return [
      { value: "", label: "전체" },
      ...filteredItems.map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    ];
  }, [draftFilters.majorCategoryId, middleCategoryItems]);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchCategoryOptions() {
      try {
        const [majorResponse, middleResponse] = await Promise.all([
          api.get<CategoryApiItem[]>("/categories/selector", {
            domain: config.categoryDomain,
            depth: 1,
            status: ["ACTIVE"],
            per_page: 100,
          }),
          api.get<CategoryApiItem[]>("/categories/selector", {
            domain: config.categoryDomain,
            depth: 2,
            status: ["ACTIVE"],
            per_page: 100,
          }),
        ]);

        if (!isApiSuccess(majorResponse) || !isApiSuccess(middleResponse)) {
          throw new Error("카테고리 필터를 불러오지 못했습니다.");
        }

        if (cancelled) return;

        setMajorCategoryItems(majorResponse.data);
        setMiddleCategoryItems(middleResponse.data);
      } catch {
        if (!cancelled) {
          setMajorCategoryItems([]);
          setMiddleCategoryItems([]);
        }
      }
    }

    void fetchCategoryOptions();

    return () => {
      cancelled = true;
    };
  }, [config.categoryDomain]);

  React.useEffect(() => {
    if (majorCategoryItems.length === 0 && middleCategoryItems.length === 0) return;

    const hydrateCategorySelection = (filters: HospitalReviewFilters): HospitalReviewFilters => {
      if (filters.majorCategoryId || filters.middleCategoryId || filters.categoryIds.length === 0) {
        return filters;
      }

      const selectedCategoryId = filters.categoryIds[0];
      const majorItem = majorCategoryItems.find((item) => String(item.id) === selectedCategoryId);
      if (majorItem) {
        return {
          ...filters,
          majorCategoryId: selectedCategoryId,
          middleCategoryId: "",
        };
      }

      const middleItem = middleCategoryItems.find((item) => String(item.id) === selectedCategoryId);
      if (!middleItem) return filters;

      return {
        ...filters,
        majorCategoryId: middleItem.parent_id ? String(middleItem.parent_id) : "",
        middleCategoryId: selectedCategoryId,
      };
    };

    setDraftFilters((prev) => hydrateCategorySelection(prev));
    setAppliedFilters((prev) => hydrateCategorySelection(prev));
  }, [majorCategoryItems, middleCategoryItems]);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  const fetchReviews = React.useCallback(
    async (manualRefresh = false) => {
      const requestKey = `${type}:${JSON.stringify(query)}`;
      if (!manualRefresh && requestKeyRef.current === requestKey) return;
      requestKeyRef.current = requestKey;

      if (!hasFetchedRef.current) setLoading(true);
      else setRefreshing(true);
      if (manualRefresh) setRefreshing(true);

      setError(null);

      try {
        const response = await api.get<HospitalReviewApiItem[]>(config.apiPath, query);

        if (!isApiSuccess(response)) {
          setError(response.error.message || "후기 목록 조회에 실패했습니다.");
          return;
        }

        setRows(response.data.map(normalizeHospitalReview));
        setMeta((response.meta as DataTableMeta | null) ?? null);
        hasFetchedRef.current = true;
      } catch {
        setError("후기 목록 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [config.apiPath, query, type],
  );

  React.useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const toggleDraftArrayValue = React.useCallback(
    (key: "postStatuses" | "ratings", value: string) => {
      setDraftFilters((prev) => {
        const exists = prev[key].includes(value);
        const nextValues = exists ? prev[key].filter((item) => item !== value) : [...prev[key], value];

        return { ...prev, [key]: nextValues };
      });
    },
    [],
  );

  const toggleAllDraftArrayValues = React.useCallback(
    (key: "postStatuses" | "ratings", options: CheckboxFilterOption[]) => {
      setDraftFilters((prev) => {
        const allValues = options.map((option) => option.value);
        const hasAll = allValues.length > 0 && allValues.every((value) => prev[key].includes(value));

        return { ...prev, [key]: hasAll ? [] : allValues };
      });
    },
    [],
  );

  const applyFilters = React.useCallback(() => {
    setSearchKeyword(searchInput.trim());
    setAppliedFilters(draftFilters);
    setPage(1);
    setSelectedIds(new Set());
  }, [draftFilters, searchInput]);

  const resetFilters = React.useCallback(() => {
    setSearchInput("");
    setSearchKeyword("");
    setDraftDateRange(undefined);
    setDraftFilters(DEFAULT_HOSPITAL_REVIEW_FILTERS);
    setAppliedFilters(DEFAULT_HOSPITAL_REVIEW_FILTERS);
    setSortState(DEFAULT_HOSPITAL_REVIEW_SORT);
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const applyDateRange = React.useCallback((nextRange?: DateRange) => {
    const mapped = mapDateRangeToHospitalReviewFilter(nextRange);

    setDraftDateRange(nextRange);
    setDraftFilters((prev) => ({
      ...prev,
      dateRange: mapped.label,
      startDate: mapped.startDate,
      endDate: mapped.endDate,
    }));
  }, []);

  const applyDatePreset = React.useCallback((preset: HospitalReviewDatePresetKey) => {
    applyDateRange(buildHospitalReviewPresetDateRange(preset));
  }, [applyDateRange]);

  const changeMetricField = React.useCallback((value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      metricField: value as HospitalReviewMetricField,
    }));
  }, []);

  const changeMajorCategory = React.useCallback((value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      majorCategoryId: value,
      middleCategoryId: "",
      categoryIds: value ? [value] : [],
    }));
  }, []);

  const changeMiddleCategory = React.useCallback((value: string) => {
    setDraftFilters((prev) => {
      if (!prev.majorCategoryId) {
        return {
          ...prev,
          middleCategoryId: "",
          categoryIds: [],
        };
      }

      if (!value) {
        return {
          ...prev,
          middleCategoryId: "",
          categoryIds: prev.majorCategoryId ? [prev.majorCategoryId] : [],
        };
      }

      const middleItem = middleCategoryItems.find((item) => String(item.id) === value);
      const majorCategoryId = middleItem?.parent_id ? String(middleItem.parent_id) : prev.majorCategoryId;

      return {
        ...prev,
        majorCategoryId,
        middleCategoryId: value,
        categoryIds: [value],
      };
    });
  }, [middleCategoryItems]);

  const toggleSort = React.useCallback((field: HospitalReviewSortField) => {
    setSortState((prev) => nextHospitalReviewSortState(prev, field));
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const toggleRow = React.useCallback((row: HospitalReviewRow, checked: boolean) => {
    if (row.visibilityChangeLocked) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(row.id);
      else next.delete(row.id);
      return next;
    });
  }, []);

  const toggleAllRows = React.useCallback((checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const selectableIds = rows
        .filter((row) => !row.visibilityChangeLocked)
        .map((row) => row.id);

      if (checked) {
        selectableIds.forEach((id) => next.add(id));
      } else {
        selectableIds.forEach((id) => next.delete(id));
      }

      return next;
    });
  }, [rows]);

  const requestBulkVisibilityChange = React.useCallback((status: "ACTIVE" | "INACTIVE") => {
    if (selectedIds.size === 0) return;

    setActionError(null);
    setPendingVisibilityChange({
      source: "bulk",
      ids: Array.from(selectedIds),
      status,
      hiddenReason: "",
    });
  }, [selectedIds]);

  const requestRowVisibilityChange = React.useCallback((row: HospitalReviewRow, status: "ACTIVE" | "INACTIVE") => {
    if (row.visibilityChangeLocked || row.status === status) return;

    setActionError(null);
    setPendingVisibilityChange({
      source: "row",
      ids: [row.id],
      status,
      hiddenReason: "",
    });
  }, []);

  const closeVisibilityConfirmModal = React.useCallback(() => {
    if (bulkUpdating || rowVisibilityUpdatingIds.size > 0) return;
    setPendingVisibilityChange(null);
  }, [bulkUpdating, rowVisibilityUpdatingIds.size]);

  const updatePendingHiddenReason = React.useCallback((value: string) => {
    setPendingVisibilityChange((prev) => prev ? { ...prev, hiddenReason: value } : prev);
  }, []);

  const confirmVisibilityChange = React.useCallback(async () => {
    if (!pendingVisibilityChange) return;

    const { source, ids, status, hiddenReason } = pendingVisibilityChange;
    const payload: HospitalReviewVisibilityUpdatePayload = {
      ids,
      status,
      ...(status === "INACTIVE" && hiddenReason?.trim() ? { hidden_reason: hiddenReason.trim() } : {}),
    };

    if (source === "bulk") {
      setBulkUpdating(true);
    } else {
      setRowVisibilityUpdatingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
    }

    setActionError(null);

    try {
      const response = await api.patch<HospitalReviewVisibilityUpdateResponse>("/hospital-reviews/status", payload);

      if (!isApiSuccess(response)) {
        setActionError(response.error.message || "후기 노출 상태 변경에 실패했습니다.");
        return;
      }

      setPendingVisibilityChange(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      await fetchReviews(true);
    } catch {
      setActionError("후기 노출 상태 변경 중 오류가 발생했습니다.");
    } finally {
      if (source === "bulk") {
        setBulkUpdating(false);
      } else {
        setRowVisibilityUpdatingIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      }
    }
  }, [fetchReviews, pendingVisibilityChange]);

  const pendingVisibilityLabel = pendingVisibilityChange?.status === "ACTIVE" ? "노출" : "미노출";
  const pendingVisibilityMessage = pendingVisibilityChange?.source === "row"
    ? `해당 후기를 ${pendingVisibilityLabel} 하시겠습니까?`
    : <>총 <span className="text-error-500">{pendingVisibilityChange?.ids.length ?? 0}</span>건을 {pendingVisibilityLabel}로 변경하시겠습니까?</>;
  const pendingVisibilityUpdating = pendingVisibilityChange
    ? pendingVisibilityChange.source === "bulk"
      ? bulkUpdating
      : pendingVisibilityChange.ids.some((id) => rowVisibilityUpdatingIds.has(id))
    : false;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="brand" size="sm" className="h-10 min-w-[88px] px-5">
          게시글
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="h-10 min-w-[88px] px-5"
        >
          댓글
        </Button>
      </div>

      <HospitalReviewsFilterPanel
        searchInput={searchInput}
        draftFilters={draftFilters}
        draftDateRange={draftDateRange}
        majorCategoryOptions={majorCategoryOptions}
        middleCategoryOptions={middleCategoryOptions}
        isStatusDropdownOpen={isStatusDropdownOpen}
        isRatingDropdownOpen={isRatingDropdownOpen}
        isDatePickerOpen={isDatePickerOpen}
        statusDropdownRef={statusDropdownRef}
        ratingDropdownRef={ratingDropdownRef}
        datePickerRef={datePickerRef}
        onSearchChange={setSearchInput}
        onToggleStatusDropdown={() => setIsStatusDropdownOpen((value) => !value)}
        onToggleRatingDropdown={() => setIsRatingDropdownOpen((value) => !value)}
        onToggleDatePicker={() => setIsDatePickerOpen((value) => !value)}
        onToggleStatus={(value) => toggleDraftArrayValue("postStatuses", value)}
        onToggleAllStatus={() => toggleAllDraftArrayValues("postStatuses", HOSPITAL_REVIEW_POST_STATUS_OPTIONS)}
        onMajorCategoryChange={changeMajorCategory}
        onMiddleCategoryChange={changeMiddleCategory}
        onToggleRating={(value) => toggleDraftArrayValue("ratings", value)}
        onToggleAllRating={() => toggleAllDraftArrayValues("ratings", HOSPITAL_REVIEW_RATING_OPTIONS)}
        onVisibilityChange={(value) => setDraftFilters((prev) => ({ ...prev, visibilityStatus: value }))}
        onBestChange={(value) => setDraftFilters((prev) => ({ ...prev, best: value }))}
        onMetricFieldChange={changeMetricField}
        onMetricMinChange={(value) => setDraftFilters((prev) => ({ ...prev, metricMin: normalizeMetricBound(value) }))}
        onMetricMaxChange={(value) => setDraftFilters((prev) => ({ ...prev, metricMax: normalizeMetricBound(value) }))}
        onApplyDateRange={applyDateRange}
        onApplyDatePreset={applyDatePreset}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />

      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {actionError}
        </div>
      ) : null}

      <HospitalReviewsDataTable
        rows={rows}
        meta={meta}
        loading={loading}
        refreshing={refreshing}
        error={error}
        sortState={sortState}
        selectedIds={selectedIds}
        visibilityUpdatingIds={rowVisibilityUpdatingIds}
        bulkUpdating={bulkUpdating}
        onToggleSort={toggleSort}
        onRefresh={() => void fetchReviews(true)}
        onGoPage={setPage}
        onToggleRow={toggleRow}
        onToggleAllRows={toggleAllRows}
        onBulkVisibilityChange={requestBulkVisibilityChange}
        onRowVisibilityChange={requestRowVisibilityChange}
      />

      <Modal
        isOpen={Boolean(pendingVisibilityChange)}
        onClose={closeVisibilityConfirmModal}
        showCloseButton={false}
        className="mx-4 w-full max-w-md"
      >
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle>노출여부 변경</ModalTitle>
          </ModalHeader>

          <ModalBody className="mt-5">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {pendingVisibilityMessage}
            </p>

            {pendingVisibilityChange?.status === "INACTIVE" ? (
              <div className="mt-4">
                <label
                  htmlFor="hospital-review-hidden-reason"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                >
                  미노출 사유
                </label>
                <InputField
                  id="hospital-review-hidden-reason"
                  name="hidden_reason"
                  value={pendingVisibilityChange.hiddenReason ?? ""}
                  onChange={(event) => updatePendingHiddenReason(event.target.value)}
                  disabled={pendingVisibilityUpdating}
                />
              </div>
            ) : null}
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeVisibilityConfirmModal}
              disabled={pendingVisibilityUpdating}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="brand"
              onClick={() => void confirmVisibilityChange()}
              disabled={pendingVisibilityUpdating}
            >
              {pendingVisibilityUpdating ? "처리 중..." : "확인"}
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>
    </div>
  );
}
