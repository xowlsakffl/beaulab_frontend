"use client";

import React from "react";

import { isApiSuccess } from "@beaulab/types";
import {
  Button,
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

type TalkVisibilityUpdateResponse = {
  updated_count: number;
  is_visible: boolean;
  ids: number[];
};

type PendingVisibilityChange = {
  ids: number[];
  isVisible: boolean;
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
      const visibleRowIds = new Set(rows.map((row) => row.id));
      const next = new Set(Array.from(prev).filter((id) => visibleRowIds.has(id)));

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
      statuses: [...draftFilters.statuses],
      categoryCodes: [...draftFilters.categoryCodes],
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
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  }, []);

  const handleToggleAllRows = React.useCallback((checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      for (const row of rows) {
        if (checked) {
          next.add(row.id);
        } else {
          next.delete(row.id);
        }
      }

      return next;
    });
  }, [rows]);

  const requestBulkVisibilityChange = React.useCallback((isVisible: boolean) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setPendingVisibilityChange({ ids, isVisible });
  }, [selectedIds]);

  const closeVisibilityConfirmModal = React.useCallback(() => {
    if (bulkUpdating) return;
    setPendingVisibilityChange(null);
  }, [bulkUpdating]);

  const confirmBulkVisibilityChange = React.useCallback(async () => {
    if (!pendingVisibilityChange) return;

    const { ids, isVisible } = pendingVisibilityChange;
    setBulkUpdating(true);
    setError(null);

    try {
      const response = await api.patch<TalkVisibilityUpdateResponse>("/talks/visibility", {
        ids,
        is_visible: isVisible,
      });

      if (!isApiSuccess(response)) {
        setError(response.error.message || "토크 노출여부 변경에 실패했습니다.");
        return;
      }

      setSelectedIds(new Set());
      setPendingVisibilityChange(null);
      await fetchTalks(true);
    } catch {
      setError("토크 노출여부 변경 중 오류가 발생했습니다.");
    } finally {
      setBulkUpdating(false);
    }
  }, [fetchTalks, pendingVisibilityChange]);

  const pendingVisibilityLabel = pendingVisibilityChange?.isVisible ? "노출" : "미노출";
  const pendingVisibilityCount = pendingVisibilityChange?.ids.length ?? 0;

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
        bulkUpdating={bulkUpdating}
        onToggleSort={handleToggleSort}
        onToggleRow={handleToggleRow}
        onToggleAllRows={handleToggleAllRows}
        onBulkVisibilityChange={requestBulkVisibilityChange}
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
              {pendingVisibilityCount.toLocaleString()}건 정말 {pendingVisibilityLabel} 하시겠습니까?
            </p>
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeVisibilityConfirmModal}
              disabled={bulkUpdating}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="brand"
              onClick={() => void confirmBulkVisibilityChange()}
              disabled={bulkUpdating}
            >
              {bulkUpdating ? "처리 중..." : "확인"}
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>
    </div>
  );
}
