"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import {
  useGlobalAlert,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import { HashtagUpsertModal } from "@/components/hashtag/list/HashtagUpsertModal";
import { HashtagsDataTable } from "@/components/hashtag/list/HashtagsDataTable";
import { HashtagsFilterPanel } from "@/components/hashtag/list/HashtagsFilterPanel";
import { HashtagsToolbar } from "@/components/hashtag/list/HashtagsToolbar";
import { api } from "@/lib/common/api";
import {
  DEFAULT_FILTERS,
  HASHTAG_STATUS_OPTIONS,
  buildPresetDateRange,
  buildHashtagsQuery,
  buildHashtagsQueryString,
  mapDateRangeToFilter,
  nextSortState,
  normalizeHashtag,
  normalizeRangeDate,
  parseHashtagsTableState,
  sanitizeHashtagName,
  type DateFilterKey,
  type DatePresetKey,
  type Filters,
  type HashtagApiItem,
  type HashtagRow,
  type SortField,
  type SortState,
} from "@/lib/hashtag/list";
import type { DateRange } from "react-day-picker";

export default function HashtagsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();
  const initialTableStateRef = React.useRef<ReturnType<typeof parseHashtagsTableState> | null>(null);

  if (!initialTableStateRef.current) {
    initialTableStateRef.current = parseHashtagsTableState(new URLSearchParams(searchParams.toString()));
  }

  const initialTableState = initialTableStateRef.current;

  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [isFilterOpen, setIsFilterOpen] = React.useState(true);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [isUpdatedDatePickerOpen, setIsUpdatedDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftUpdatedDateRange, setDraftUpdatedDateRange] = React.useState<DateRange | undefined>(initialTableState.draftUpdatedDateRange);
  const [draftFilters, setDraftFilters] = React.useState<Filters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(initialTableState.filters);
  const statusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);
  const updatedDatePickerRef = React.useRef<HTMLDivElement | null>(null);
  const [sortState, setSortState] = React.useState<SortState>(initialTableState.sortState);
  const [perPage, setPerPage] = React.useState(initialTableState.perPage);
  const [page, setPage] = React.useState(initialTableState.page);

  const [rows, setRows] = React.useState<HashtagRow[]>([]);
  const [highlightedRowId, setHighlightedRowId] = React.useState<number | null>(null);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const [upsertMode, setUpsertMode] = React.useState<"create" | "edit" | null>(null);
  const [selectedRow, setSelectedRow] = React.useState<HashtagRow | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const requestKeyRef = React.useRef("");
  const hasFetchedRef = React.useRef(false);

  const query = React.useMemo(
    () =>
      buildHashtagsQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        perPage,
        page,
      }),
    [appliedFilters, page, perPage, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildHashtagsQueryString(query), [query]);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  const fetchHashtags = React.useCallback(
    async (manualRefresh = false) => {
      const requestKey = JSON.stringify(query);
      if (!manualRefresh && requestKeyRef.current === requestKey) return;
      requestKeyRef.current = requestKey;

      if (!hasFetchedRef.current) setLoading(true);
      else setRefreshing(true);
      if (manualRefresh) setRefreshing(true);

      setError(null);

      try {
        const response = await api.get<HashtagApiItem[]>("/hashtags", query);
        if (!isApiSuccess(response)) {
          setError(response.error.message || "해시태그 목록 조회에 실패했습니다.");
          return;
        }

        const responseMeta = (response.meta as DataTableMeta | null) ?? null;

        setRows(response.data.map(normalizeHashtag));
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
        setError("해시태그 목록 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [query],
  );

  React.useEffect(() => {
    void fetchHashtags(false);
  }, [fetchHashtags]);

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

  React.useEffect(() => {
    if (!highlightedRowId) return;

    const timer = window.setTimeout(() => {
      setHighlightedRowId((current) => current === highlightedRowId ? null : current);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [highlightedRowId]);

  const closeUpsertModal = React.useCallback(() => {
    if (isSubmitting) return;

    setUpsertMode(null);
    setSelectedRow(null);
    setSubmitError(null);
  }, [isSubmitting]);

  const openCreateModal = React.useCallback(() => {
    setUpsertMode("create");
    setSelectedRow(null);
    setSubmitError(null);
  }, []);

  const openEditModal = React.useCallback((row: HashtagRow) => {
    setUpsertMode("edit");
    setSelectedRow(row);
    setSubmitError(null);
  }, []);

  const applyFilters = React.useCallback(() => {
    setPage(1);
    setAppliedFilters({
      statuses: [...draftFilters.statuses],
      dateRange: draftFilters.dateRange,
      startDate: draftFilters.startDate,
      endDate: draftFilters.endDate,
      updatedDateRange: draftFilters.updatedDateRange,
      updatedStartDate: draftFilters.updatedStartDate,
      updatedEndDate: draftFilters.updatedEndDate,
    });
  }, [draftFilters]);

  const resetFilters = React.useCallback((applyNow = true) => {
    setDraftFilters(DEFAULT_FILTERS);
    setDraftDateRange(undefined);
    setDraftUpdatedDateRange(undefined);
    setIsDatePickerOpen(false);
    setIsUpdatedDatePickerOpen(false);
    if (applyNow) {
      setPage(1);
      setAppliedFilters(DEFAULT_FILTERS);
    }
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
      statuses:
        prev.statuses.length === HASHTAG_STATUS_OPTIONS.length
          ? []
          : HASHTAG_STATUS_OPTIONS.map((item) => item.value),
    }));
  }, []);

  const applyDateRange = React.useCallback((
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

    setDraftUpdatedDateRange(normalizedRange);
    setDraftFilters((prev) => ({
      ...prev,
      updatedDateRange: mapped.label,
      updatedStartDate: mapped.startDate,
      updatedEndDate: mapped.endDate,
    }));

    if (options?.closePicker) {
      setIsUpdatedDatePickerOpen(false);
    }
  }, []);

  const applyDatePreset = React.useCallback((key: DateFilterKey, preset: DatePresetKey) => {
    applyDateRange(key, buildPresetDateRange(preset), { closePicker: true });
  }, [applyDateRange]);

  const handleSubmitHashtag = React.useCallback(
    async (name: string, status: string) => {
      const sanitizedName = sanitizeHashtagName(name);
      if (!sanitizedName) return;

      const isEditMode = upsertMode === "edit" && selectedRow !== null;
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const response = isEditMode
          ? await api.patch<HashtagApiItem>(`/hashtags/${selectedRow.id}`, { name: sanitizedName, status })
          : await api.post<HashtagApiItem>("/hashtags", { name: sanitizedName, status });

        if (!isApiSuccess(response)) {
          setSubmitError(response.error.message || (isEditMode ? "해시태그 수정에 실패했습니다." : "해시태그 등록에 실패했습니다."));
          return;
        }

        const savedRow = normalizeHashtag(response.data);
        setHighlightedRowId(savedRow.id);
        setUpsertMode(null);
        setSelectedRow(null);
        setSubmitError(null);

        showAlert({
          variant: "success",
          title: isEditMode ? "해시태그 수정 완료" : "해시태그 등록 완료",
          message: isEditMode
            ? "변경된 해시태그를 목록에서 확인할 수 있습니다."
            : "새 해시태그를 목록에서 확인할 수 있습니다.",
        });

        await fetchHashtags(true);
      } catch {
        setSubmitError(isEditMode ? "해시태그 수정 중 오류가 발생했습니다." : "해시태그 등록 중 오류가 발생했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchHashtags, selectedRow, showAlert, upsertMode],
  );

  return (
    <>
      <div className="space-y-4">
        <HashtagsToolbar
          searchInput={searchInput}
          isFilterOpen={isFilterOpen}
          onSearchChange={setSearchInput}
          onToggleFilters={() => setIsFilterOpen((prev) => !prev)}
          onOpenCreate={openCreateModal}
        />

        <HashtagsFilterPanel
          isOpen={isFilterOpen}
          draftFilters={draftFilters}
          draftDateRange={draftDateRange}
          draftUpdatedDateRange={draftUpdatedDateRange}
          isStatusDropdownOpen={isStatusDropdownOpen}
          isDatePickerOpen={isDatePickerOpen}
          isUpdatedDatePickerOpen={isUpdatedDatePickerOpen}
          statusDropdownRef={statusDropdownRef}
          datePickerRef={datePickerRef}
          updatedDatePickerRef={updatedDatePickerRef}
          onToggleFilters={() => setIsFilterOpen((prev) => !prev)}
          onToggleStatusDropdown={() => setIsStatusDropdownOpen((prev) => !prev)}
          onToggleDatePicker={() => {
            setIsUpdatedDatePickerOpen(false);
            setIsDatePickerOpen((prev) => !prev);
          }}
          onToggleUpdatedDatePicker={() => {
            setIsDatePickerOpen(false);
            setIsUpdatedDatePickerOpen((prev) => !prev);
          }}
          onToggleStatus={toggleStatus}
          onToggleAllStatus={toggleAllStatus}
          onApplyDateRange={(key, nextRange) => applyDateRange(key, nextRange)}
          onApplyDatePreset={applyDatePreset}
          onApplyFilters={applyFilters}
          onResetFilters={() => resetFilters(true)}
        />

        <HashtagsDataTable
          rows={rows}
          meta={meta}
          loading={loading}
          refreshing={refreshing}
          error={error}
          highlightedRowId={highlightedRowId}
          sortState={sortState}
          perPage={perPage}
          onToggleSort={(field: SortField) => {
            setPage(1);
            setSortState((current) => nextSortState(current, field));
          }}
          onRefresh={() => void fetchHashtags(true)}
          onGoPage={setPage}
          onPerPageChange={(value) => {
            setPage(1);
            setPerPage(value);
          }}
          onRowClick={openEditModal}
        />
      </div>

      <HashtagUpsertModal
        isOpen={upsertMode !== null}
        mode={upsertMode ?? "create"}
        initialName={selectedRow?.name ?? ""}
        initialStatus={selectedRow?.status ?? "ACTIVE"}
        submitting={isSubmitting}
        submitError={submitError}
        onClose={closeUpsertModal}
        onSubmit={(name, status) => void handleSubmitHashtag(name, status)}
      />
    </>
  );
}
