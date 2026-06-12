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

import { HospitalEvaluationsDataTable } from "@/components/hospital-evaluation/list/HospitalEvaluationsDataTable";
import { HospitalEvaluationsFilterPanel } from "@/components/hospital-evaluation/list/HospitalEvaluationsFilterPanel";
import { api, isApiRequestCanceledError } from "@/lib/common/api";
import type { CategoryApiItem } from "@/lib/common/category";
import {
  DEFAULT_HOSPITAL_EVALUATION_FILTERS,
  DEFAULT_HOSPITAL_EVALUATION_SORT,
  buildHospitalEvaluationPresetDateRange,
  buildHospitalEvaluationsQuery,
  buildHospitalEvaluationsQueryString,
  mapDateRangeToHospitalEvaluationFilter,
  nextHospitalEvaluationSortState,
  normalizeHospitalEvaluation,
  normalizeMetricBound,
  parseHospitalEvaluationsTableState,
  type HospitalEvaluationApiItem,
  type HospitalEvaluationDatePresetKey,
  type HospitalEvaluationFilters,
  type HospitalEvaluationRow,
  type HospitalEvaluationSortField,
  type HospitalEvaluationSortState,
} from "@/lib/hospital-evaluation/list";

type HospitalEvaluationVisibilityUpdateResponse = {
  updated_count: number;
  status: string;
  ids: number[];
};

type HospitalEvaluationVisibilityUpdatePayload = {
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

export function HospitalEvaluationsTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTableStateRef = React.useRef<ReturnType<typeof parseHospitalEvaluationsTableState> | null>(null);
  const hasFetchedRef = React.useRef(false);
  const requestKeyRef = React.useRef("");

  if (!initialTableStateRef.current) {
    initialTableStateRef.current = parseHospitalEvaluationsTableState(new URLSearchParams(searchParams.toString()));
  }

  const initialTableState = initialTableStateRef.current;
  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [isReviewTypeDropdownOpen, setIsReviewTypeDropdownOpen] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftFilters, setDraftFilters] = React.useState<HospitalEvaluationFilters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<HospitalEvaluationFilters>(initialTableState.filters);
  const [sortState, setSortState] = React.useState<HospitalEvaluationSortState>(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);
  const [rows, setRows] = React.useState<HospitalEvaluationRow[]>([]);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [bulkUpdating, setBulkUpdating] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(() => new Set());
  const [rowVisibilityUpdatingIds, setRowVisibilityUpdatingIds] = React.useState<Set<number>>(() => new Set());
  const [pendingVisibilityChange, setPendingVisibilityChange] = React.useState<PendingVisibilityChange>(null);
  const [reviewTypeOptions, setReviewTypeOptions] = React.useState<CheckboxFilterOption[]>([]);
  const reviewTypeDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);

  const query = React.useMemo(
    () =>
      buildHospitalEvaluationsQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        page,
      }),
    [appliedFilters, page, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildHospitalEvaluationsQueryString(query), [query]);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchReviewTypeOptions() {
      try {
        const response = await api.get<CategoryApiItem[]>("/categories/selector", {
          domain: "HOSPITAL_EVALUATION",
          status: ["ACTIVE"],
          per_page: 10,
        });

        if (!isApiSuccess(response)) {
          throw new Error(response.error.message || "후기유형 필터를 불러오지 못했습니다.");
        }

        if (cancelled) return;

        setReviewTypeOptions(response.data.map((item) => ({
          value: String(item.id),
          label: item.name,
        })));
      } catch {
        if (!cancelled) {
          setReviewTypeOptions([]);
        }
      }
    }

    void fetchReviewTypeOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  const fetchEvaluations = React.useCallback(
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
        const response = await api.get<HospitalEvaluationApiItem[]>("/hospital-evaluations", query, {
          latestKey: "hospital-evaluations:list",
        });

        if (!isApiSuccess(response)) {
          setError(response.error.message || "평가 목록 조회에 실패했습니다.");
          return;
        }

        setRows(response.data.map(normalizeHospitalEvaluation));
        setMeta((response.meta as DataTableMeta | null) ?? null);
        hasFetchedRef.current = true;
      } catch (error) {
        if (isApiRequestCanceledError(error)) {
          shouldFinalize = false;
          return;
        }

        setError("평가 목록 조회 중 오류가 발생했습니다.");
      } finally {
        if (shouldFinalize) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [query],
  );

  React.useEffect(() => {
    void fetchEvaluations();
  }, [fetchEvaluations]);

  React.useEffect(() => {
    setSelectedIds((prev) => {
      const selectableIds = new Set(rows
        .filter((row) => !row.visibilityChangeLocked)
        .map((row) => row.id));
      const next = new Set(Array.from(prev).filter((id) => selectableIds.has(id)));

      return next.size === prev.size ? prev : next;
    });
  }, [rows]);

  React.useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!reviewTypeDropdownRef.current?.contains(target)) {
        setIsReviewTypeDropdownOpen(false);
      }

      if (!datePickerRef.current?.contains(target)) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

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
    setDraftFilters(DEFAULT_HOSPITAL_EVALUATION_FILTERS);
    setAppliedFilters(DEFAULT_HOSPITAL_EVALUATION_FILTERS);
    setSortState(DEFAULT_HOSPITAL_EVALUATION_SORT);
    setIsReviewTypeDropdownOpen(false);
    setIsDatePickerOpen(false);
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const applyDateRange = React.useCallback((nextRange?: DateRange) => {
    const mapped = mapDateRangeToHospitalEvaluationFilter(nextRange);

    setDraftDateRange(nextRange);
    setDraftFilters((prev) => ({
      ...prev,
      dateRange: mapped.label,
      startDate: mapped.startDate,
      endDate: mapped.endDate,
    }));
  }, []);

  const applyDatePreset = React.useCallback((preset: HospitalEvaluationDatePresetKey) => {
    applyDateRange(buildHospitalEvaluationPresetDateRange(preset));
  }, [applyDateRange]);

  const toggleReviewType = React.useCallback((value: string) => {
    setDraftFilters((prev) => {
      const selected = new Set(prev.categoryIds);
      if (selected.has(value)) selected.delete(value);
      else selected.add(value);

      return { ...prev, categoryIds: Array.from(selected) };
    });
  }, []);

  const toggleAllReviewTypes = React.useCallback(() => {
    setDraftFilters((prev) => {
      const allValues = reviewTypeOptions.map((option) => option.value);
      const isAllSelected = allValues.length > 0 && allValues.every((value) => prev.categoryIds.includes(value));

      return { ...prev, categoryIds: isAllSelected ? [] : allValues };
    });
  }, [reviewTypeOptions]);

  const toggleSort = React.useCallback((field: HospitalEvaluationSortField) => {
    setSortState((prev) => nextHospitalEvaluationSortState(prev, field));
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const toggleRow = React.useCallback((row: HospitalEvaluationRow, checked: boolean) => {
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

    const currentRowsById = new Map(rows.map((row) => [row.id, row]));
    const ids = Array.from(selectedIds)
      .filter((id) => !currentRowsById.get(id)?.visibilityChangeLocked);
    if (ids.length === 0) return;

    setActionError(null);
    setPendingVisibilityChange({
      source: "bulk",
      ids,
      status,
      hiddenReason: "",
    });
  }, [rows, selectedIds]);

  const requestRowVisibilityChange = React.useCallback((row: HospitalEvaluationRow, status: "ACTIVE" | "INACTIVE") => {
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
    const payload: HospitalEvaluationVisibilityUpdatePayload = {
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
      const response = await api.patch<HospitalEvaluationVisibilityUpdateResponse>("/hospital-evaluations/status", payload);

      if (!isApiSuccess(response)) {
        setActionError(response.error.message || "평가 노출 상태 변경에 실패했습니다.");
        return;
      }

      setPendingVisibilityChange(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      await fetchEvaluations(true);
    } catch {
      setActionError("평가 노출 상태 변경 중 오류가 발생했습니다.");
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
  }, [fetchEvaluations, pendingVisibilityChange]);

  const openEvaluationDetail = React.useCallback((row: HospitalEvaluationRow) => {
    const returnTo = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(`${pathname}/${row.id}?returnTo=${encodeURIComponent(returnTo)}`);
  }, [pathname, queryString, router]);

  const pendingVisibilityLabel = pendingVisibilityChange?.status === "ACTIVE" ? "노출" : "미노출";
  const pendingVisibilityMessage = pendingVisibilityChange?.source === "row"
    ? `해당 평가를 ${pendingVisibilityLabel} 하시겠습니까?`
    : <>총 <span className="text-error-500">{pendingVisibilityChange?.ids.length ?? 0}</span>건을 {pendingVisibilityLabel}로 변경하시겠습니까?</>;
  const pendingVisibilityUpdating = pendingVisibilityChange
    ? pendingVisibilityChange.source === "bulk"
      ? bulkUpdating
      : pendingVisibilityChange.ids.some((id) => rowVisibilityUpdatingIds.has(id))
    : false;

  return (
    <div className="space-y-4">
      <HospitalEvaluationsFilterPanel
        searchInput={searchInput}
        draftFilters={draftFilters}
        reviewTypeOptions={reviewTypeOptions}
        draftDateRange={draftDateRange}
        isReviewTypeDropdownOpen={isReviewTypeDropdownOpen}
        isDatePickerOpen={isDatePickerOpen}
        reviewTypeDropdownRef={reviewTypeDropdownRef}
        datePickerRef={datePickerRef}
        onSearchChange={setSearchInput}
        onToggleReviewTypeDropdown={() => {
          setIsReviewTypeDropdownOpen((value) => !value);
        }}
        onToggleDatePicker={() => {
          setIsDatePickerOpen((value) => !value);
        }}
        onVisibilityChange={(value) => setDraftFilters((prev) => ({ ...prev, visibilityStatus: value }))}
        onReportStatusChange={(value) => setDraftFilters((prev) => ({ ...prev, reportStatus: value }))}
        onRatingChange={(value) => setDraftFilters((prev) => ({ ...prev, rating: value }))}
        onToggleReviewType={toggleReviewType}
        onToggleAllReviewType={toggleAllReviewTypes}
        onCostMinChange={(value) => setDraftFilters((prev) => ({ ...prev, costMin: normalizeMetricBound(value) }))}
        onCostMaxChange={(value) => setDraftFilters((prev) => ({ ...prev, costMax: normalizeMetricBound(value) }))}
        onViewCountMinChange={(value) => setDraftFilters((prev) => ({ ...prev, viewCountMin: normalizeMetricBound(value) }))}
        onViewCountMaxChange={(value) => setDraftFilters((prev) => ({ ...prev, viewCountMax: normalizeMetricBound(value) }))}
        onApplyDateRange={applyDateRange}
        onApplyDatePreset={applyDatePreset}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />

      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700   ">
          {actionError}
        </div>
      ) : null}

      <HospitalEvaluationsDataTable
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
        onRefresh={() => void fetchEvaluations(true)}
        onGoPage={setPage}
        onToggleRow={toggleRow}
        onToggleAllRows={toggleAllRows}
        onBulkVisibilityChange={requestBulkVisibilityChange}
        onRowVisibilityChange={requestRowVisibilityChange}
        onOpenDetail={openEvaluationDetail}
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
            <p className="text-sm font-medium text-gray-800 ">
              {pendingVisibilityMessage}
            </p>

            {pendingVisibilityChange?.status === "INACTIVE" ? (
              <div className="mt-4">
                <label
                  htmlFor="hospital-evaluation-hidden-reason"
                  className="mb-1.5 block text-sm font-medium text-gray-700 "
                >
                  미노출 사유
                </label>
                <InputField
                  id="hospital-evaluation-hidden-reason"
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
