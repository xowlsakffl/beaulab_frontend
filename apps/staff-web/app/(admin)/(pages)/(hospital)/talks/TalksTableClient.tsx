"use client";

import React from "react";

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
  type DataTableMeta,
} from "@beaulab/ui-admin";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";

import { TalksDataTable } from "@/components/talk/list/TalksDataTable";
import { TalksFilterPanel } from "@/components/talk/list/TalksFilterPanel";
import { api } from "@/lib/common/api";
import {
  DEFAULT_FILTERS,
  TALK_CATEGORY_OPTIONS,
  TALK_POST_STATUS_OPTIONS,
  buildPresetDateRange,
  buildTalksQuery,
  buildTalksQueryString,
  mapDateRangeToFilter,
  nextSortState,
  normalizeMetricBound,
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

type TalkVisibilityUpdateResponse = {
  updated_count: number;
  status: string;
  ids: number[];
};

type TalkVisibilityUpdatePayload = {
  ids: number[];
  status: string;
  hidden_reason?: string;
};

type PendingVisibilityChange = {
  source: "bulk" | "row";
  ids: number[];
  status: string;
  hiddenReason?: string;
} | null;

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
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = React.useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftFilters, setDraftFilters] = React.useState<Filters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(initialTableState.filters);
  const [sortState, setSortState] = React.useState<SortState>(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);
  const [rows, setRows] = React.useState<TalkRow[]>([]);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [bulkUpdating, setBulkUpdating] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(() => new Set());
  const [rowVisibilityUpdatingIds, setRowVisibilityUpdatingIds] = React.useState<Set<number>>(() => new Set());
  const [pendingVisibilityChange, setPendingVisibilityChange] = React.useState<PendingVisibilityChange>(null);
  const statusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const categoryDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);

  const query = React.useMemo(
    () =>
      buildTalksQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        page,
      }),
    [appliedFilters, page, searchKeyword, sortState],
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
    setSelectedIds((prev) => {
      const selectableRowIds = new Set(rows
        .filter((row) => !row.visibilityChangeLocked)
        .map((row) => row.id));
      const next = new Set(Array.from(prev).filter((id) => selectableRowIds.has(id)));

      return next.size === prev.size ? prev : next;
    });
  }, [rows]);

  React.useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!statusDropdownRef.current?.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (!categoryDropdownRef.current?.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
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
    setSearchKeyword(searchInput.trim());
    setAppliedFilters({
      postStatuses: [...draftFilters.postStatuses],
      categoryCodes: [...draftFilters.categoryCodes],
      visibilityStatus: draftFilters.visibilityStatus,
      metricField: draftFilters.metricField,
      metricMin: normalizeMetricBound(draftFilters.metricMin),
      metricMax: normalizeMetricBound(draftFilters.metricMax),
      dateRange: draftFilters.dateRange,
      startDate: draftFilters.startDate,
      endDate: draftFilters.endDate,
    });
  }, [draftFilters, searchInput]);

  const resetFilters = React.useCallback(() => {
    setSearchInput("");
    setSearchKeyword("");
    setDraftFilters(DEFAULT_FILTERS);
    setDraftDateRange(undefined);
    setIsStatusDropdownOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsDatePickerOpen(false);
    setPage(1);
    setAppliedFilters(DEFAULT_FILTERS);
  }, []);

  const toggleStatus = React.useCallback((value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.postStatuses.includes(value);
      return {
        ...prev,
        postStatuses: exists
          ? prev.postStatuses.filter((item) => item !== value)
          : [...prev.postStatuses, value],
      };
    });
  }, []);

  const toggleAllStatus = React.useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      postStatuses: prev.postStatuses.length === TALK_POST_STATUS_OPTIONS.length
        ? []
        : TALK_POST_STATUS_OPTIONS.map((item) => item.value),
    }));
  }, []);

  const toggleCategory = React.useCallback((value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.categoryCodes.includes(value);

      return {
        ...prev,
        categoryCodes: exists
          ? prev.categoryCodes.filter((item) => item !== value)
          : [...prev.categoryCodes, value],
      };
    });
  }, []);

  const toggleAllCategory = React.useCallback(() => {
    setDraftFilters((prev) => {
      const allCategoryValues = TALK_CATEGORY_OPTIONS.map((item) => item.value);
      const isAllSelected = allCategoryValues.length > 0 &&
        allCategoryValues.every((value) => prev.categoryCodes.includes(value));

      return {
        ...prev,
        categoryCodes: isAllSelected ? [] : allCategoryValues,
      };
    });
  }, []);

  const changeVisibility = React.useCallback((value: string) => {
    setIsStatusDropdownOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsDatePickerOpen(false);
    setDraftFilters((prev) => ({
      ...prev,
      visibilityStatus: value,
    }));
  }, []);

  const changeMetricField = React.useCallback((value: string) => {
    setIsStatusDropdownOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsDatePickerOpen(false);
    setDraftFilters((prev) => ({
      ...prev,
      metricField: value === "save_count" || value === "comment_count" || value === "view_count"
        ? value
        : "like_count",
    }));
  }, []);

  const changeMetricMin = React.useCallback((value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      metricMin: normalizeMetricBound(value),
    }));
  }, []);

  const changeMetricMax = React.useCallback((value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      metricMax: normalizeMetricBound(value),
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

  const handleToggleRow = React.useCallback((id: number, checked: boolean) => {
    const row = rows.find((item) => item.id === id);
    if (checked && row?.visibilityChangeLocked) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  }, [rows]);

  const handleToggleAllRows = React.useCallback((checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      for (const row of rows) {
        if (checked && !row.visibilityChangeLocked) {
          next.add(row.id);
        } else if (!checked) {
          next.delete(row.id);
        }
      }

      return next;
    });
  }, [rows]);

  const requestBulkVisibilityChange = React.useCallback((status: string) => {
    const currentRowsById = new Map(rows.map((row) => [row.id, row]));
    const ids = Array.from(selectedIds)
      .filter((id) => !currentRowsById.get(id)?.visibilityChangeLocked);
    if (ids.length === 0) return;

    setPendingVisibilityChange({ source: "bulk", ids, status });
  }, [rows, selectedIds]);

  const handleRowVisibilityChange = React.useCallback((id: number, status: string) => {
    setPendingVisibilityChange({
      source: "row",
      ids: [id],
      status,
      hiddenReason: "",
    });
  }, []);

  const closeVisibilityConfirmModal = React.useCallback(() => {
    if (bulkUpdating) return;
    if (
      pendingVisibilityChange?.source === "row"
      && pendingVisibilityChange.ids.some((id) => rowVisibilityUpdatingIds.has(id))
    ) {
      return;
    }

    setPendingVisibilityChange(null);
  }, [bulkUpdating, pendingVisibilityChange, rowVisibilityUpdatingIds]);

  const updatePendingHiddenReason = React.useCallback((value: string) => {
    setPendingVisibilityChange((prev) => (
      prev?.source === "row"
        ? { ...prev, hiddenReason: value }
        : prev
    ));
  }, []);

  const confirmVisibilityChange = React.useCallback(async () => {
    if (!pendingVisibilityChange) return;

    const { ids, status, source, hiddenReason } = pendingVisibilityChange;
    const isBulkChange = source === "bulk";
    const normalizedHiddenReason = source === "row" && status === "INACTIVE"
      ? hiddenReason?.trim()
      : "";
    const requestPayload: TalkVisibilityUpdatePayload = {
      ids,
      status,
    };

    if (normalizedHiddenReason) {
      requestPayload.hidden_reason = normalizedHiddenReason;
    }

    if (isBulkChange) {
      setBulkUpdating(true);
    } else {
      setRowVisibilityUpdatingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));

        return next;
      });
    }

    setError(null);

    try {
      const response = await api.patch<TalkVisibilityUpdateResponse>("/talks/visibility", requestPayload);

      if (!isApiSuccess(response)) {
        setError(response.error.message || "토크 노출여부 변경에 실패했습니다.");
        return;
      }

      setPendingVisibilityChange(null);

      if (isBulkChange) {
        setSelectedIds(new Set());
        await fetchTalks(true);
      } else {
        setRows((prev) => prev.map((row) => (
          ids.includes(row.id)
            ? { ...row, status, isVisible: status === "ACTIVE" }
            : row
        )));
      }
    } catch {
      setError("토크 노출여부 변경 중 오류가 발생했습니다.");
    } finally {
      if (isBulkChange) {
        setBulkUpdating(false);
      } else {
        setRowVisibilityUpdatingIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));

          return next;
        });
      }
    }
  }, [fetchTalks, pendingVisibilityChange]);

  const pendingVisibilityLabel = pendingVisibilityChange?.status === "ACTIVE" ? "노출" : "미노출";
  const pendingVisibilityCount = pendingVisibilityChange?.ids.length ?? 0;
  const pendingVisibilityUpdating = bulkUpdating
    || Boolean(
      pendingVisibilityChange?.source === "row"
      && pendingVisibilityChange.ids.some((id) => rowVisibilityUpdatingIds.has(id)),
    );

  return (
    <div className="min-w-0 space-y-4">
      <TalksFilterPanel
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        draftFilters={draftFilters}
        draftDateRange={draftDateRange}
        isStatusDropdownOpen={isStatusDropdownOpen}
        isCategoryDropdownOpen={isCategoryDropdownOpen}
        isDatePickerOpen={isDatePickerOpen}
        statusDropdownRef={statusDropdownRef}
        categoryDropdownRef={categoryDropdownRef}
        datePickerRef={datePickerRef}
        onToggleStatusDropdown={() => {
          setIsCategoryDropdownOpen(false);
          setIsDatePickerOpen(false);
          setIsStatusDropdownOpen((prev) => !prev);
        }}
        onToggleCategoryDropdown={() => {
          setIsStatusDropdownOpen(false);
          setIsDatePickerOpen(false);
          setIsCategoryDropdownOpen((prev) => !prev);
        }}
        onToggleDatePicker={() => {
          setIsStatusDropdownOpen(false);
          setIsCategoryDropdownOpen(false);
          setIsDatePickerOpen((prev) => !prev);
        }}
        onToggleStatus={toggleStatus}
        onToggleAllStatus={toggleAllStatus}
        onToggleCategory={toggleCategory}
        onToggleAllCategory={toggleAllCategory}
        onVisibilityChange={changeVisibility}
        onMetricFieldChange={changeMetricField}
        onMetricMinChange={changeMetricMin}
        onMetricMaxChange={changeMetricMax}
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
        selectedIds={selectedIds}
        visibilityUpdatingIds={rowVisibilityUpdatingIds}
        bulkUpdating={bulkUpdating}
        onToggleSort={handleToggleSort}
        onToggleRow={handleToggleRow}
        onToggleAllRows={handleToggleAllRows}
        onBulkVisibilityChange={requestBulkVisibilityChange}
        onRowVisibilityChange={handleRowVisibilityChange}
        onRefresh={() => void fetchTalks(true)}
        onGoPage={setPage}
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
              총 <span className="text-error-500">{pendingVisibilityCount.toLocaleString()}</span>건을 {pendingVisibilityLabel}로 변경하시겠습니까?
            </p>

            {pendingVisibilityChange?.source === "row" && pendingVisibilityChange.status === "INACTIVE" && (
              <div className="mt-4">
                <label
                  htmlFor="talk-hidden-reason"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                >
                  미노출 사유
                </label>
                <InputField
                  id="talk-hidden-reason"
                  name="hidden_reason"
                  value={pendingVisibilityChange.hiddenReason ?? ""}
                  onChange={(event) => updatePendingHiddenReason(event.target.value)}
                  disabled={pendingVisibilityUpdating}
                />
              </div>
            )}
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
