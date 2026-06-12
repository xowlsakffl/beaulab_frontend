"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { isApiSuccess } from "@beaulab/types";
import { Button, type DataTableMeta } from "@beaulab/ui-admin";

import { ReportedContentDataTable } from "@/components/reported-content/list/ReportedContentDataTable";
import { ReportedContentFilterPanel } from "@/components/reported-content/list/ReportedContentFilterPanel";
import { ReportedContentStatsCards } from "@/components/reported-content/list/ReportedContentStatsCards";
import { api, isApiRequestCanceledError } from "@/lib/common/api";
import {
  DEFAULT_REPORTED_CONTENT_SORT,
  REPORTED_CONTENT_BOARD_CONFIGS,
  buildReportedContentPresetDateRange,
  buildReportedContentQuery,
  buildReportedContentQueryString,
  defaultReportedContentFilters,
  mapDateRangeToReportedContentFilter,
  nextReportedContentSortState,
  normalizeReportedContent,
  parseReportedContentTableState,
  type ReportedContentApiItem,
  type ReportedContentBoardMode,
  type ReportedContentBoardType,
  type ReportedContentDatePresetKey,
  type ReportedContentDateType,
  type ReportedContentFilters,
  type ReportedContentRow,
  type ReportedContentSortField,
  type ReportedContentSortState,
  type ReportedContentSummary,
} from "@/lib/reported-content/list";

type ReportedContentTableClientProps = {
  type: ReportedContentBoardType;
};

export function ReportedContentTableClient({ type }: ReportedContentTableClientProps) {
  const config = REPORTED_CONTENT_BOARD_CONFIGS[type];
  const supportsComments = Boolean(config.commentApiPath && config.commentKind);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTableStateRef = React.useRef<ReturnType<typeof parseReportedContentTableState> | null>(null);
  const initialBoardRef = React.useRef<ReportedContentBoardMode | null>(null);
  const hasFetchedRef = React.useRef(false);
  const requestKeyRef = React.useRef("");
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);

  if (!initialTableStateRef.current) {
    initialTableStateRef.current = parseReportedContentTableState(new URLSearchParams(searchParams.toString()), config);
  }

  if (!initialBoardRef.current) {
    initialBoardRef.current = supportsComments && searchParams.get("board") === "comments" ? "comments" : "posts";
  }

  const initialTableState = initialTableStateRef.current;
  const [activeBoard, setActiveBoard] = React.useState<ReportedContentBoardMode>(initialBoardRef.current ?? "posts");
  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftFilters, setDraftFilters] = React.useState<ReportedContentFilters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<ReportedContentFilters>(initialTableState.filters);
  const [sortState, setSortState] = React.useState<ReportedContentSortState>(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);
  const [rows, setRows] = React.useState<ReportedContentRow[]>([]);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [summary, setSummary] = React.useState<ReportedContentSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const activeKind = activeBoard === "comments" ? config.commentKind ?? config.kind : config.kind;
  const activeApiPath = activeBoard === "comments" ? config.commentApiPath ?? config.apiPath : config.apiPath;
  const showSummaryCards = config.showSummaryCards !== false;

  const query = React.useMemo(
    () =>
      buildReportedContentQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        page,
      }),
    [appliedFilters, page, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => {
    const params = new URLSearchParams(buildReportedContentQueryString(query));
    if (activeBoard === "comments") params.set("board", "comments");
    else params.delete("board");

    return params.toString();
  }, [activeBoard, query]);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  const fetchSummary = React.useCallback(async () => {
    if (!showSummaryCards) {
      setSummary(null);
      return;
    }

    try {
      const response = await api.get<ReportedContentSummary>(`${activeApiPath}/summary`, undefined, {
        latestKey: "reported-content:summary",
      });

      if (!isApiSuccess(response)) {
        return;
      }

      setSummary(response.data);
    } catch (error) {
      if (isApiRequestCanceledError(error)) return;

      setSummary(null);
    }
  }, [activeApiPath, showSummaryCards]);

  const fetchRows = React.useCallback(
    async (manualRefresh = false) => {
      const requestKey = JSON.stringify({ apiPath: activeApiPath, query });
      if (!manualRefresh && requestKeyRef.current === requestKey) return;
      requestKeyRef.current = requestKey;

      if (!hasFetchedRef.current) setLoading(true);
      else setRefreshing(true);
      if (manualRefresh) setRefreshing(true);

      setError(null);
      let shouldFinalize = true;

      try {
        const response = await api.get<ReportedContentApiItem[]>(activeApiPath, query, {
          latestKey: "reported-content:list",
        });

        if (!isApiSuccess(response)) {
          setError(response.error.message || "신고게시물 목록 조회에 실패했습니다.");
          return;
        }

        const normalizedRows = response.data
          .map((item) => normalizeReportedContent(item, config, activeKind));
        const responseMeta = (response.meta as DataTableMeta | null) ?? null;

        setRows(normalizedRows);
        setMeta(responseMeta ? {
          current_page: responseMeta.current_page,
          per_page: responseMeta.per_page,
          total: responseMeta.total,
          last_page: responseMeta.last_page,
        } : null);
        hasFetchedRef.current = true;
      } catch (error) {
        if (isApiRequestCanceledError(error)) {
          shouldFinalize = false;
          return;
        }

        setError("신고게시물 목록 조회 중 오류가 발생했습니다.");
      } finally {
        if (shouldFinalize) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [activeApiPath, activeKind, config, query],
  );

  React.useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  React.useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  React.useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

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
  }, [draftFilters, searchInput]);

  const resetFilters = React.useCallback(() => {
    const defaultFilters = defaultReportedContentFilters(config);

    setSearchInput("");
    setSearchKeyword("");
    setDraftDateRange(undefined);
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setSortState(DEFAULT_REPORTED_CONTENT_SORT);
    setIsDatePickerOpen(false);
    setPage(1);
  }, [config]);

  const changeBoard = React.useCallback((nextBoard: ReportedContentBoardMode) => {
    if (nextBoard === activeBoard || (nextBoard === "comments" && !supportsComments)) return;

    const defaultFilters = defaultReportedContentFilters(config);

    setActiveBoard(nextBoard);
    setSearchInput("");
    setSearchKeyword("");
    setDraftDateRange(undefined);
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setSortState(DEFAULT_REPORTED_CONTENT_SORT);
    setIsDatePickerOpen(false);
    setPage(1);
    setRows([]);
    setMeta(null);
    setSummary(null);
    setError(null);
    hasFetchedRef.current = false;
    requestKeyRef.current = "";
  }, [activeBoard, config, supportsComments]);

  const applyDateRange = React.useCallback((nextRange?: DateRange) => {
    const mapped = mapDateRangeToReportedContentFilter(nextRange);

    setDraftDateRange(nextRange);
    setDraftFilters((prev) => ({
      ...prev,
      dateRange: mapped.label,
      startDate: mapped.startDate,
      endDate: mapped.endDate,
    }));
  }, []);

  const applyDatePreset = React.useCallback((preset: ReportedContentDatePresetKey) => {
    applyDateRange(buildReportedContentPresetDateRange(preset));
  }, [applyDateRange]);

  const changeDraftFilter = React.useCallback(<K extends keyof ReportedContentFilters>(
    key: K,
    value: ReportedContentFilters[K],
  ) => {
    setDraftFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const toggleSort = React.useCallback((field: ReportedContentSortField) => {
    setSortState((prev) => nextReportedContentSortState(prev, field));
    setPage(1);
  }, []);

  const openDetail = React.useCallback((row: ReportedContentRow) => {
    if (!row.detailPath) return;

    const [detailPath, detailQuery = ""] = row.detailPath.split("?");
    const params = new URLSearchParams(detailQuery);
    params.set("returnTo", queryString ? `${config.listPath}?${queryString}` : config.listPath);
    router.push(`${detailPath}?${params.toString()}`);
  }, [config.listPath, queryString, router]);

  return (
    <div className="min-w-0 space-y-4">
      {supportsComments ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={activeBoard === "posts" ? "brand" : "outline"}
            size="sm"
            onClick={() => changeBoard("posts")}
            className="h-10 min-w-[88px] px-5"
          >
            게시글
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
      ) : null}
      {showSummaryCards ? <ReportedContentStatsCards summary={summary} /> : null}
      <ReportedContentFilterPanel
        searchInput={searchInput}
        draftFilters={draftFilters}
        draftDateRange={draftDateRange}
        isDatePickerOpen={isDatePickerOpen}
        datePickerRef={datePickerRef}
        onSearchChange={setSearchInput}
        onDateTypeChange={(value) => changeDraftFilter("dateType", value as ReportedContentDateType)}
        onToggleDatePicker={() => setIsDatePickerOpen((prev) => !prev)}
        onApplyDateRange={applyDateRange}
        onApplyDatePreset={applyDatePreset}
        onReportReasonChange={(value) => changeDraftFilter("reportReason", value)}
        onReportCountMinChange={(value) => changeDraftFilter("reportCountMin", value)}
        onReportCountMaxChange={(value) => changeDraftFilter("reportCountMax", value)}
        onVisibilityChange={(value) => changeDraftFilter("visibilityStatus", value)}
        onReportStatusChange={(value) => changeDraftFilter("reportStatus", value)}
        onWarningStatusChange={(value) => changeDraftFilter("warningStatus", value)}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
        dateTypeOptions={config.dateTypeOptions}
        reportStatusOptions={config.statusOptions}
        searchInputPlaceholder={config.searchInputPlaceholder}
        reportStatusLabel={config.statusLabel}
        dateTypeInline={config.dateTypeInline}
        showVisibilityFilter={config.showVisibilityFilter ?? true}
        showReportStatusFilter={config.showReportStatusFilter ?? true}
        showReportCountFilter={config.showReportCountFilter ?? true}
        showWarningFilter={config.showWarningFilter ?? true}
        singleLineFilters={config.singleLineFilters ?? false}
      />
      <ReportedContentDataTable
        kind={activeKind}
        rows={rows}
        meta={meta}
        loading={loading}
        refreshing={refreshing}
        error={error}
        sortState={sortState}
        onToggleSort={toggleSort}
        onGoPage={setPage}
        onRefresh={() => void Promise.all([fetchRows(true), fetchSummary()])}
        onOpenDetail={openDetail}
      />
    </div>
  );
}
