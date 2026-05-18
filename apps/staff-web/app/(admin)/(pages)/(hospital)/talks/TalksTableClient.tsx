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
  type CheckboxFilterOption,
  type DataTableMeta,
} from "@beaulab/ui-admin";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";

import { TalkCommentsDataTable } from "@/components/talk/list/TalkCommentsDataTable";
import { TalksDataTable } from "@/components/talk/list/TalksDataTable";
import { TalksFilterPanel } from "@/components/talk/list/TalksFilterPanel";
import { api, downloadFile } from "@/lib/common/api";
import type { CategoryApiItem } from "@/lib/common/category";
import {
  DEFAULT_TALK_COMMENT_SORT,
  buildTalkCommentsQuery,
  buildTalkCommentsQueryString,
  nextTalkCommentSortState,
  normalizeTalkComment,
  parseTalkCommentSortState,
  type TalkCommentApiItem,
  type TalkCommentRow,
  type TalkCommentSortField,
  type TalkCommentSortState,
} from "@/lib/talk/comment-list";
import {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  buildTalksExcelDownloadPath,
  buildPresetDateRange,
  buildTalksQuery,
  buildTalksQueryString,
  formatTalkCategoryName,
  isTalkExcelDateRangeAllowed,
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

type TalkBoard = "talks" | "comments";

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
  board: TalkBoard;
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
  const initialCommentSortStateRef = React.useRef<TalkCommentSortState | null>(null);
  const initialBoardRef = React.useRef<TalkBoard | null>(null);
  const hasFetchedRef = React.useRef(false);
  const requestKeyRef = React.useRef("");

  if (!initialTableStateRef.current) {
    const initialSearchParams = new URLSearchParams(searchParams.toString());

    initialTableStateRef.current = parseTalksTableState(initialSearchParams);
    initialCommentSortStateRef.current = parseTalkCommentSortState(initialSearchParams);
    initialBoardRef.current = initialSearchParams.get("board") === "comments" ? "comments" : "talks";
  }

  const initialTableState = initialTableStateRef.current;

  const [activeBoard, setActiveBoard] = React.useState<TalkBoard>(initialBoardRef.current ?? "talks");
  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftFilters, setDraftFilters] = React.useState<Filters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(initialTableState.filters);
  const [sortState, setSortState] = React.useState<SortState>(initialTableState.sortState);
  const [commentSortState, setCommentSortState] = React.useState<TalkCommentSortState>(
    initialCommentSortStateRef.current ?? DEFAULT_TALK_COMMENT_SORT,
  );
  const [page, setPage] = React.useState(initialTableState.page);
  const [rows, setRows] = React.useState<TalkRow[]>([]);
  const [commentRows, setCommentRows] = React.useState<TalkCommentRow[]>([]);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [bulkUpdating, setBulkUpdating] = React.useState(false);
  const [excelDownloading, setExcelDownloading] = React.useState(false);
  const [excelValidationMessage, setExcelValidationMessage] = React.useState<string | null>(null);
  const [categoryOptions, setCategoryOptions] = React.useState<CheckboxFilterOption[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(() => new Set());
  const [rowVisibilityUpdatingIds, setRowVisibilityUpdatingIds] = React.useState<Set<number>>(() => new Set());
  const [pendingVisibilityChange, setPendingVisibilityChange] = React.useState<PendingVisibilityChange>(null);
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

  const commentQuery = React.useMemo(
    () =>
      buildTalkCommentsQuery({
        searchKeyword,
        appliedFilters,
        sortState: commentSortState,
        page,
      }),
    [appliedFilters, commentSortState, page, searchKeyword],
  );

  const queryString = React.useMemo(() => {
    if (activeBoard === "comments") {
      const params = new URLSearchParams(buildTalkCommentsQueryString(commentQuery));
      params.set("board", "comments");

      return params.toString();
    }

    return buildTalksQueryString(query);
  }, [activeBoard, commentQuery, query]);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchTalkCategoryOptions() {
      try {
        const response = await api.get<CategoryApiItem[]>("/categories/selector", {
          domain: "TALK",
          status: ["ACTIVE"],
          per_page: 100,
        });

        if (!isApiSuccess(response)) {
          throw new Error(response.error.message || "토크 유형 필터를 불러오지 못했습니다.");
        }

        if (cancelled) return;

        setCategoryOptions(response.data.map((item) => ({
          value: String(item.id),
          label: formatTalkCategoryName(item) || item.name,
        })));
      } catch {
        if (!cancelled) {
          setCategoryOptions([]);
        }
      }
    }

    void fetchTalkCategoryOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  const fetchTalks = React.useCallback(
    async (manualRefresh = false) => {
      const requestKey = `talks:${JSON.stringify(query)}`;
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

  const fetchTalkComments = React.useCallback(
    async (manualRefresh = false) => {
      const requestKey = `comments:${JSON.stringify(commentQuery)}`;
      if (!manualRefresh && requestKeyRef.current === requestKey) return;
      requestKeyRef.current = requestKey;

      if (!hasFetchedRef.current) setLoading(true);
      else setRefreshing(true);
      if (manualRefresh) setRefreshing(true);

      setError(null);

      try {
        const response = await api.get<TalkCommentApiItem[]>("/talk-comments", commentQuery);

        if (!isApiSuccess(response)) {
          setError(response.error.message || "토크 댓글 목록 조회에 실패했습니다.");
          return;
        }

        setCommentRows(response.data.map(normalizeTalkComment));
        setMeta((response.meta as DataTableMeta | null) ?? null);
        hasFetchedRef.current = true;
      } catch {
        setError("토크 댓글 목록 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [commentQuery],
  );

  React.useEffect(() => {
    if (activeBoard === "talks") {
      void fetchTalks(false);
    }
  }, [activeBoard, fetchTalks]);

  React.useEffect(() => {
    if (activeBoard === "comments") {
      void fetchTalkComments(false);
    }
  }, [activeBoard, fetchTalkComments]);

  React.useEffect(() => {
    setSelectedIds((prev) => {
      const activeRows = activeBoard === "comments" ? commentRows : rows;
      const selectableRowIds = new Set(activeRows
        .filter((row) => !row.visibilityChangeLocked)
        .map((row) => row.id));
      const next = new Set(Array.from(prev).filter((id) => selectableRowIds.has(id)));

      return next.size === prev.size ? prev : next;
    });
  }, [activeBoard, commentRows, rows]);

  React.useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
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
      categoryIds: [...draftFilters.categoryIds],
      visibilityStatus: draftFilters.visibilityStatus,
      reportStatus: draftFilters.reportStatus,
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
    setIsCategoryDropdownOpen(false);
    setIsDatePickerOpen(false);
    setPage(1);
    setAppliedFilters(DEFAULT_FILTERS);
  }, []);

  const toggleCategory = React.useCallback((value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.categoryIds.includes(value);

      return {
        ...prev,
        categoryIds: exists
          ? prev.categoryIds.filter((item) => item !== value)
          : [...prev.categoryIds, value],
      };
    });
  }, []);

  const toggleAllCategory = React.useCallback(() => {
    setDraftFilters((prev) => {
      const allCategoryValues = categoryOptions.map((item) => item.value);
      const isAllSelected = allCategoryValues.length > 0 &&
        allCategoryValues.every((value) => prev.categoryIds.includes(value));

      return {
        ...prev,
        categoryIds: isAllSelected ? [] : allCategoryValues,
      };
    });
  }, [categoryOptions]);

  const changeVisibility = React.useCallback((value: string) => {
    setIsCategoryDropdownOpen(false);
    setIsDatePickerOpen(false);
    setDraftFilters((prev) => ({
      ...prev,
      visibilityStatus: value,
    }));
  }, []);

  const changeReportStatus = React.useCallback((value: string) => {
    setIsCategoryDropdownOpen(false);
    setIsDatePickerOpen(false);
    setDraftFilters((prev) => ({
      ...prev,
      reportStatus: value,
    }));
  }, []);

  const changeMetricField = React.useCallback((value: string) => {
    setIsCategoryDropdownOpen(false);
    setIsDatePickerOpen(false);
    setDraftFilters((prev) => ({
      ...prev,
      metricField: value === "" || value === "save_count" || value === "comment_count" || value === "view_count"
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

  const changeBoard = React.useCallback((board: TalkBoard) => {
    if (board === activeBoard) return;

    requestKeyRef.current = "";
    setActiveBoard(board);
    setPage(1);
    setSearchInput("");
    setSearchKeyword("");
    setDraftDateRange(undefined);
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSortState(DEFAULT_SORT);
    setCommentSortState(DEFAULT_TALK_COMMENT_SORT);
    setIsCategoryDropdownOpen(false);
    setIsDatePickerOpen(false);
    setSelectedIds(new Set());
    setRowVisibilityUpdatingIds(new Set());
    setPendingVisibilityChange(null);
    setExcelValidationMessage(null);
    setError(null);
  }, [activeBoard]);

  const handleToggleSort = React.useCallback((field: SortField) => {
    setPage(1);
    setSortState((prev) => nextSortState(prev, field));
  }, []);

  const handleToggleCommentSort = React.useCallback((field: TalkCommentSortField) => {
    setPage(1);
    setCommentSortState((prev) => nextTalkCommentSortState(prev, field));
  }, []);

  const handleToggleRow = React.useCallback((id: number, checked: boolean) => {
    const activeRows = activeBoard === "comments" ? commentRows : rows;
    const row = activeRows.find((item) => item.id === id);
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
  }, [activeBoard, commentRows, rows]);

  const handleToggleAllRows = React.useCallback((checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const activeRows = activeBoard === "comments" ? commentRows : rows;

      for (const row of activeRows) {
        if (checked && !row.visibilityChangeLocked) {
          next.add(row.id);
        } else if (!checked) {
          next.delete(row.id);
        }
      }

      return next;
    });
  }, [activeBoard, commentRows, rows]);

  const requestBulkVisibilityChange = React.useCallback((status: string) => {
    const activeRows = activeBoard === "comments" ? commentRows : rows;
    const currentRowsById = new Map(activeRows.map((row) => [row.id, row]));
    const ids = Array.from(selectedIds)
      .filter((id) => !currentRowsById.get(id)?.visibilityChangeLocked);
    if (ids.length === 0) return;

    setPendingVisibilityChange({ board: activeBoard, source: "bulk", ids, status });
  }, [activeBoard, commentRows, rows, selectedIds]);

  const handleRowVisibilityChange = React.useCallback((id: number, status: string) => {
    setPendingVisibilityChange({
      board: "talks",
      source: "row",
      ids: [id],
      status,
      hiddenReason: "",
    });
  }, []);

  const handleCommentRowVisibilityChange = React.useCallback((id: number, status: string) => {
    const row = commentRows.find((item) => item.id === id);
    if (row?.visibilityChangeLocked) return;

    setPendingVisibilityChange({
      board: "comments",
      source: "row",
      ids: [id],
      status,
      hiddenReason: "",
    });
  }, [commentRows]);

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

    const { board, ids, status, source, hiddenReason } = pendingVisibilityChange;
    const isBulkChange = source === "bulk";
    const isCommentChange = board === "comments";
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
      const response = await api.patch<TalkVisibilityUpdateResponse>(
        isCommentChange ? "/talk-comments/status" : "/talks/status",
        requestPayload,
      );

      if (!isApiSuccess(response)) {
        setError(response.error.message || `${isCommentChange ? "토크 댓글" : "토크"} 노출여부 변경에 실패했습니다.`);
        return;
      }

      setPendingVisibilityChange(null);

      if (isBulkChange) {
        setSelectedIds(new Set());
        if (isCommentChange) {
          await fetchTalkComments(true);
        } else {
          await fetchTalks(true);
        }
      } else if (isCommentChange) {
        await fetchTalkComments(true);
      } else {
        await fetchTalks(true);
      }
    } catch {
      setError(`${isCommentChange ? "토크 댓글" : "토크"} 노출여부 변경 중 오류가 발생했습니다.`);
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
  }, [fetchTalkComments, fetchTalks, pendingVisibilityChange]);

  const handleDownloadExcel = React.useCallback(async () => {
    const excelFilters: Filters = {
      categoryIds: [...draftFilters.categoryIds],
      visibilityStatus: draftFilters.visibilityStatus,
      reportStatus: draftFilters.reportStatus,
      metricField: draftFilters.metricField,
      metricMin: normalizeMetricBound(draftFilters.metricMin),
      metricMax: normalizeMetricBound(draftFilters.metricMax),
      dateRange: draftFilters.dateRange,
      startDate: draftFilters.startDate,
      endDate: draftFilters.endDate,
    };
    const startDate = excelFilters.startDate;
    const endDate = excelFilters.endDate;

    if (!startDate || !endDate) {
      setError(null);
      setExcelValidationMessage("작성일을 선택해주세요.");
      return;
    }

    if (!isTalkExcelDateRangeAllowed(startDate, endDate)) {
      setError(null);
      setExcelValidationMessage("엑셀 다운로드 작성일 기간은 시작일 이후 종료일이어야 하며, 최대 1개월까지만 가능합니다.");
      return;
    }

    setExcelDownloading(true);
    setExcelValidationMessage(null);
    setError(null);

    try {
      const excelQuery = buildTalksQuery({
        searchKeyword: searchInput.trim(),
        appliedFilters: excelFilters,
        sortState,
        page: 1,
      });

      await downloadFile(
        buildTalksExcelDownloadPath(excelQuery),
        `talks_${startDate}_${endDate}.xls`,
      );
    } catch {
      setError("토크 엑셀 다운로드 중 오류가 발생했습니다.");
    } finally {
      setExcelDownloading(false);
    }
  }, [draftFilters, searchInput, sortState]);

  const openTalkDetail = React.useCallback((row: TalkRow) => {
    const returnTo = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(`/talks/${row.id}?returnTo=${encodeURIComponent(returnTo)}`);
  }, [pathname, queryString, router]);

  React.useEffect(() => {
    rows.slice(0, 10).forEach((row) => {
      router.prefetch(`/talks/${row.id}`);
    });
  }, [router, rows]);

  const pendingVisibilityLabel = pendingVisibilityChange?.status === "ACTIVE" ? "노출" : "미노출";
  const pendingVisibilityCount = pendingVisibilityChange?.ids.length ?? 0;
  const pendingVisibilityMessage = pendingVisibilityChange?.source === "row"
    ? `해당 ${pendingVisibilityChange.board === "comments" ? "댓글을" : "토크를"} ${pendingVisibilityLabel} 하시겠습니까?`
    : <>총 <span className="text-error-500">{pendingVisibilityCount.toLocaleString()}</span>건을 {pendingVisibilityLabel} 하시겠습니까?</>;
  const pendingVisibilityUpdating = bulkUpdating
    || Boolean(
      pendingVisibilityChange?.source === "row"
      && pendingVisibilityChange.ids.some((id) => rowVisibilityUpdatingIds.has(id)),
    );

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={activeBoard === "talks" ? "brand" : "outline"}
          size="sm"
          onClick={() => changeBoard("talks")}
          className="h-10 min-w-[88px] px-5"
        >
          토크
        </Button>
        <Button
          type="button"
          variant={activeBoard === "comments" ? "brand" : "outline"}
          size="sm"
          onClick={() => changeBoard("comments")}
          className="h-10 min-w-[88px] px-5"
        >
          댓글
        </Button>
      </div>

      <TalksFilterPanel
        board={activeBoard}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        draftFilters={draftFilters}
        draftDateRange={draftDateRange}
        categoryOptions={categoryOptions}
        isCategoryDropdownOpen={isCategoryDropdownOpen}
        isDatePickerOpen={isDatePickerOpen}
        categoryDropdownRef={categoryDropdownRef}
        datePickerRef={datePickerRef}
        onToggleCategoryDropdown={() => {
          setIsDatePickerOpen(false);
          setIsCategoryDropdownOpen((prev) => !prev);
        }}
        onToggleDatePicker={() => {
          setIsCategoryDropdownOpen(false);
          setIsDatePickerOpen((prev) => !prev);
        }}
        onToggleCategory={toggleCategory}
        onToggleAllCategory={toggleAllCategory}
        onVisibilityChange={changeVisibility}
        onReportStatusChange={changeReportStatus}
        onMetricFieldChange={changeMetricField}
        onMetricMinChange={changeMetricMin}
        onMetricMaxChange={changeMetricMax}
        onApplyDateRange={applyDateRange}
        onApplyDatePreset={applyDatePreset}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />

      {activeBoard === "talks" ? (
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
          excelDownloading={excelDownloading}
          onToggleSort={handleToggleSort}
          onToggleRow={handleToggleRow}
          onToggleAllRows={handleToggleAllRows}
          onBulkVisibilityChange={requestBulkVisibilityChange}
          onRowVisibilityChange={handleRowVisibilityChange}
          onOpenDetail={openTalkDetail}
          onDownloadExcel={() => void handleDownloadExcel()}
          onRefresh={() => void fetchTalks(true)}
          onGoPage={setPage}
        />
      ) : (
        <TalkCommentsDataTable
          rows={commentRows}
          meta={meta}
          loading={loading}
          refreshing={refreshing}
          error={error}
          sortState={commentSortState}
          selectedIds={selectedIds}
          visibilityUpdatingIds={rowVisibilityUpdatingIds}
          bulkUpdating={bulkUpdating}
          onToggleSort={handleToggleCommentSort}
          onToggleRow={handleToggleRow}
          onToggleAllRows={handleToggleAllRows}
          onBulkVisibilityChange={requestBulkVisibilityChange}
          onRowVisibilityChange={handleCommentRowVisibilityChange}
          onRefresh={() => void fetchTalkComments(true)}
          onGoPage={setPage}
        />
      )}

      <Modal
        isOpen={Boolean(excelValidationMessage)}
        onClose={() => setExcelValidationMessage(null)}
        showCloseButton={false}
        className="mx-4 w-full max-w-md"
      >
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle>엑셀 다운로드 조건 확인</ModalTitle>
          </ModalHeader>

          <ModalBody className="mt-5">
            <p className="text-sm font-medium leading-6 text-gray-800 dark:text-white/90">
              {excelValidationMessage}
            </p>
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="brand"
              onClick={() => setExcelValidationMessage(null)}
            >
              확인
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>

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

            {pendingVisibilityChange?.source === "row" && pendingVisibilityChange.status === "INACTIVE" && (
              <div className="mt-4">
                <label
                  htmlFor="visibility-hidden-reason"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                >
                  미노출 사유
                </label>
                <InputField
                  id="visibility-hidden-reason"
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
