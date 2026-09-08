"use client";

import { useSyncCurrentPageQuery } from "@/hooks/common/useSyncCurrentPageQuery";

import React from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { hasPermission } from "@beaulab/auth";
import type { DateRange } from "react-day-picker";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
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
import { VisibilityConfirmModal } from "@/components/common/VisibilityActionButtons";
import { usePostListVisibility } from "@/hooks/post-content/usePostListVisibility";
import { useReviewCategoryFilters } from "@/hooks/hospital-review/useReviewCategoryFilters";
import { useListData } from "@/hooks/common/useListData";
import { api } from "@/lib/common/api";
import { getSession } from "@/lib/common/auth/session";
import { STAFF_STATUS_PERMISSIONS } from "@/lib/common/status-permissions";
import {
  DEFAULT_HOSPITAL_REVIEW_COMMENT_SORT,
  buildHospitalReviewCommentsQuery,
  buildHospitalReviewCommentsQueryString,
  nextHospitalReviewCommentSortState,
  normalizeHospitalReviewComment,
  parseHospitalReviewCommentSortState,
  resetHospitalReviewCommentFilters,
  type HospitalReviewCommentApiItem,
  type HospitalReviewCommentRow,
  type HospitalReviewCommentSortField,
  type HospitalReviewCommentSortState,
} from "@/lib/hospital-review/comment-list";
import {
  DEFAULT_HOSPITAL_REVIEW_FILTERS,
  DEFAULT_HOSPITAL_REVIEW_SORT,
  HOSPITAL_REVIEW_BOARD_CONFIGS,
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

const HospitalReviewCommentsDataTable = dynamic(() =>
  import("@/components/hospital-review/list/HospitalReviewCommentsDataTable").then(
    (module) => module.HospitalReviewCommentsDataTable,
  ),
);
const HospitalReviewCommentsFilterPanel = dynamic(() =>
  import("@/components/hospital-review/list/HospitalReviewCommentsFilterPanel").then(
    (module) => module.HospitalReviewCommentsFilterPanel,
  ),
);

type HospitalReviewBoard = "posts" | "comments";

type HospitalReviewsTableClientProps = {
  type: HospitalReviewBoardType;
};

export function HospitalReviewsTableClient({ type }: HospitalReviewsTableClientProps) {
  const config = HOSPITAL_REVIEW_BOARD_CONFIGS[type];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canUpdateStatus = hasPermission(getSession()?.auth, STAFF_STATUS_PERMISSIONS.hospitalReview);
  const [initialState] = React.useState(() => {
    const initialSearchParams = new URLSearchParams(searchParams.toString());

    return {
      tableState: parseHospitalReviewsTableState(initialSearchParams),
      commentSortState: parseHospitalReviewCommentSortState(initialSearchParams),
      board: (initialSearchParams.get("board") === "comments" ? "comments" : "posts") as HospitalReviewBoard,
    };
  });

  const initialTableState = initialState.tableState;
  const [activeBoard, setActiveBoard] = React.useState<HospitalReviewBoard>(initialState.board);
  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [isRatingDropdownOpen, setIsRatingDropdownOpen] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftFilters, setDraftFilters] = React.useState<HospitalReviewFilters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<HospitalReviewFilters>(initialTableState.filters);
  const [sortState, setSortState] = React.useState<HospitalReviewSortState>(initialTableState.sortState);
  const [commentSortState, setCommentSortState] = React.useState<HospitalReviewCommentSortState>(
    initialState.commentSortState,
  );
  const [page, setPage] = React.useState(initialTableState.page);
  const [isMetricRequiredModalOpen, setIsMetricRequiredModalOpen] = React.useState(false);
  const ratingDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);

  const query = React.useMemo(
    () =>
      buildHospitalReviewsQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        page,
        categoryDomain: config.categoryDomain,
      }),
    [appliedFilters, config.categoryDomain, page, searchKeyword, sortState],
  );

  const commentQuery = React.useMemo(
    () =>
      buildHospitalReviewCommentsQuery({
        searchKeyword,
        appliedFilters,
        sortState: commentSortState,
        page,
        categoryDomain: config.categoryDomain,
      }),
    [appliedFilters, commentSortState, config.categoryDomain, page, searchKeyword],
  );

  const queryString = React.useMemo(() => {
    if (activeBoard === "comments") {
      return buildHospitalReviewCommentsQueryString(commentQuery);
    }

    return buildHospitalReviewsQueryString(query);
  }, [activeBoard, commentQuery, query]);

  const fetchReviewRows = React.useCallback(
    async (nextQuery: typeof query, signal: AbortSignal) => {
      const response = await api.get<HospitalReviewApiItem[]>("/hospital-reviews", nextQuery, {
        signal,
        latestKey: `hospital-reviews:${type}:posts`,
      });

      if (!isApiSuccess(response)) {
        throw new Error(response.error.message || "후기 목록 조회에 실패했습니다.");
      }

      return {
        rows: response.data.map(normalizeHospitalReview),
        meta: (response.meta as DataTableMeta | null) ?? null,
      };
    },
    [type],
  );

  const fetchReviewCommentRows = React.useCallback(
    async (nextQuery: typeof commentQuery, signal: AbortSignal) => {
      const response = await api.get<HospitalReviewCommentApiItem[]>("/hospital-review-comments", nextQuery, {
        signal,
        latestKey: `hospital-reviews:${type}:comments`,
      });

      if (!isApiSuccess(response)) {
        throw new Error(response.error.message || "후기 댓글 목록 조회에 실패했습니다.");
      }

      return {
        rows: response.data.map(normalizeHospitalReviewComment),
        meta: (response.meta as DataTableMeta | null) ?? null,
      };
    },
    [type],
  );

  const {
    rows,
    fetchList: refreshReviews,
    meta: reviewMeta,
    error: reviewError,
    loading: reviewLoading,
    refreshing: reviewRefreshing,
    resetList: resetReviewList,
  } = useListData({
    cacheNamespace: `hospital-reviews:${type}`,
    query,
    fetchRows: fetchReviewRows,
    errorMessage: "후기 목록 조회 중 오류가 발생했습니다.",
    enabled: activeBoard === "posts",
  });

  const {
    rows: commentRows,
    fetchList: refreshComments,
    meta: commentMeta,
    error: commentError,
    loading: commentLoading,
    refreshing: commentRefreshing,
    resetList: resetCommentList,
  } = useListData({
    cacheNamespace: `hospital-review-comments:${type}`,
    query: commentQuery,
    fetchRows: fetchReviewCommentRows,
    errorMessage: "후기 댓글 목록 조회 중 오류가 발생했습니다.",
    enabled: activeBoard === "comments",
  });

  const meta = activeBoard === "comments" ? commentMeta : reviewMeta;
  const error = activeBoard === "comments" ? commentError : reviewError;
  const loading = activeBoard === "comments" ? commentLoading : reviewLoading;
  const refreshing = activeBoard === "comments" ? commentRefreshing : reviewRefreshing;

  const {
    selectedIds,
    setSelectedIds,
    actionError,
    bulkUpdating,
    rowVisibilityUpdatingIds,
    pendingVisibilityChange,
    resetVisibility,
    toggleRow: toggleRowById,
    toggleAllRows,
    requestBulkVisibilityChange,
    requestRowVisibilityChange: requestVisibilityById,
    closeVisibilityConfirmModal,
    updatePendingHiddenReason,
    confirmVisibilityChange,
  } = usePostListVisibility({
    scopeKey: `hospital-reviews:${type}:${activeBoard}`,
    board: activeBoard,
    rows: activeBoard === "comments" ? commentRows : rows,
    statusPath: activeBoard === "comments" ? "/hospital-review-comments/status" : "/hospital-reviews/status",
    canUpdateStatus,
    refresh: () => {
      void (activeBoard === "comments" ? refreshComments : refreshReviews)(true);
    },
  });
  const {
    majorCategoryOptions,
    middleCategoryOptions,
    smallCategoryOptions,
    changeMajorCategory,
    changeMiddleCategory,
    changeSmallCategory,
  } = useReviewCategoryFilters(config.categoryUsage, draftFilters, setDraftFilters, setAppliedFilters);

  useSyncCurrentPageQuery({
    pathname,
    queryString,
    searchParams,
    onNavigate: (params) => {
      const next = parseHospitalReviewsTableState(params);
      setSearchInput(next.searchKeyword);
      setSearchKeyword(next.searchKeyword);
      setDraftDateRange(next.draftDateRange);
      setDraftFilters(next.filters);
      setAppliedFilters(next.filters);
      setSortState(next.sortState);
      setPage(next.page);
      setActiveBoard(params.get("board") === "comments" ? "comments" : "posts");
      setCommentSortState(parseHospitalReviewCommentSortState(params));
      setSelectedIds(new Set());
    },
  });

  React.useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!ratingDropdownRef.current?.contains(target)) {
        setIsRatingDropdownOpen(false);
      }
      if (!datePickerRef.current?.contains(target)) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const toggleDraftArrayValue = React.useCallback((key: "ratings", value: string) => {
    setDraftFilters((prev) => {
      const exists = prev[key].includes(value);
      const nextValues = exists ? prev[key].filter((item) => item !== value) : [...prev[key], value];

      return { ...prev, [key]: nextValues };
    });
  }, []);

  const toggleAllDraftArrayValues = React.useCallback((key: "ratings", options: CheckboxFilterOption[]) => {
    setDraftFilters((prev) => {
      const allValues = options.map((option) => option.value);
      const hasAll = allValues.length > 0 && allValues.every((value) => prev[key].includes(value));

      return { ...prev, [key]: hasAll ? [] : allValues };
    });
  }, []);

  const applyFilters = React.useCallback(() => {
    const metricMin = normalizeMetricBound(draftFilters.metricMin);
    const metricMax = normalizeMetricBound(draftFilters.metricMax);

    if (activeBoard === "posts" && (metricMin !== "" || metricMax !== "") && draftFilters.metricField === "") {
      setIsMetricRequiredModalOpen(true);
      return;
    }

    setSearchKeyword(searchInput.trim());
    setAppliedFilters({
      ...draftFilters,
      metricMin,
      metricMax,
    });
    setPage(1);
    setSelectedIds(new Set());
  }, [setSelectedIds, activeBoard, draftFilters, searchInput]);

  const resetFilters = React.useCallback(() => {
    setSearchInput("");
    setSearchKeyword("");
    setDraftDateRange(undefined);
    setDraftFilters(DEFAULT_HOSPITAL_REVIEW_FILTERS);
    setAppliedFilters(DEFAULT_HOSPITAL_REVIEW_FILTERS);
    setSortState(DEFAULT_HOSPITAL_REVIEW_SORT);
    setCommentSortState(DEFAULT_HOSPITAL_REVIEW_COMMENT_SORT);
    setIsRatingDropdownOpen(false);
    setIsDatePickerOpen(false);
    setPage(1);
    setSelectedIds(new Set());
  }, [setSelectedIds]);

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

  const applyDatePreset = React.useCallback(
    (preset: HospitalReviewDatePresetKey) => {
      applyDateRange(buildHospitalReviewPresetDateRange(preset));
    },
    [applyDateRange],
  );

  const changeMetricField = React.useCallback((value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      metricField: value as HospitalReviewMetricField,
    }));
  }, []);

  const toggleSort = React.useCallback(
    (field: HospitalReviewSortField) => {
      setSortState((prev) => nextHospitalReviewSortState(prev, field));
      setPage(1);
      setSelectedIds(new Set());
    },
    [setSelectedIds],
  );

  const toggleCommentSort = React.useCallback(
    (field: HospitalReviewCommentSortField) => {
      setCommentSortState((prev) => nextHospitalReviewCommentSortState(prev, field));
      setPage(1);
      setSelectedIds(new Set());
    },
    [setSelectedIds],
  );

  const changeBoard = React.useCallback(
    (board: HospitalReviewBoard) => {
      if (board === activeBoard) return;

      const nextFilters = {
        ...(board === "comments" ? resetHospitalReviewCommentFilters() : DEFAULT_HOSPITAL_REVIEW_FILTERS),
        authorId: appliedFilters.authorId,
      };

      setActiveBoard(board);
      setSearchInput("");
      setSearchKeyword("");
      setDraftDateRange(undefined);
      setDraftFilters(nextFilters);
      setAppliedFilters(nextFilters);
      setSortState(DEFAULT_HOSPITAL_REVIEW_SORT);
      setCommentSortState(DEFAULT_HOSPITAL_REVIEW_COMMENT_SORT);
      setPage(1);
      setSelectedIds(new Set());
      resetVisibility();
      if (board === "comments") resetCommentList();
      else resetReviewList();
    },
    [setSelectedIds, activeBoard, appliedFilters.authorId, resetCommentList, resetReviewList, resetVisibility],
  );

  const toggleRow = React.useCallback(
    (row: HospitalReviewRow | HospitalReviewCommentRow, checked: boolean) => toggleRowById(row.id, checked),
    [toggleRowById],
  );
  const requestRowVisibilityChange = React.useCallback(
    (row: HospitalReviewRow | HospitalReviewCommentRow, status: "ACTIVE" | "INACTIVE") =>
      requestVisibilityById(row.id, status),
    [requestVisibilityById],
  );

  const openReviewDetail = React.useCallback(
    (row: HospitalReviewRow) => {
      const returnTo = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(`${config.listPath}/${row.id}?returnTo=${encodeURIComponent(returnTo)}`);
    },
    [config.listPath, pathname, queryString, router],
  );

  const pendingVisibilityLabel = pendingVisibilityChange?.status === "ACTIVE" ? "노출" : "미노출";
  const pendingVisibilityTarget = pendingVisibilityChange?.board === "comments" ? "댓글" : "후기";
  const pendingVisibilityMessage =
    pendingVisibilityChange?.source === "row" ? (
      `해당 ${pendingVisibilityTarget}을 ${pendingVisibilityLabel} 하시겠습니까?`
    ) : (
      <>
        총 <span className="text-error-500">{pendingVisibilityChange?.ids.length ?? 0}</span>건을{" "}
        {pendingVisibilityLabel}로 변경하시겠습니까?
      </>
    );
  const pendingVisibilityUpdating = pendingVisibilityChange
    ? pendingVisibilityChange.source === "bulk"
      ? bulkUpdating
      : pendingVisibilityChange.ids.some((id) => rowVisibilityUpdatingIds.has(id))
    : false;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={activeBoard === "posts" ? "brand" : "outline"}
          size="sm"
          className="h-10 min-w-[88px] px-5"
          onClick={() => changeBoard("posts")}
        >
          게시글
        </Button>
        <Button
          type="button"
          variant={activeBoard === "comments" ? "brand" : "outline"}
          size="sm"
          className="h-10 min-w-[88px] px-5"
          onClick={() => changeBoard("comments")}
        >
          댓글
        </Button>
      </div>

      {activeBoard === "posts" ? (
        <HospitalReviewsFilterPanel
          searchInput={searchInput}
          draftFilters={draftFilters}
          draftDateRange={draftDateRange}
          majorCategoryOptions={majorCategoryOptions}
          middleCategoryOptions={middleCategoryOptions}
          isRatingDropdownOpen={isRatingDropdownOpen}
          isDatePickerOpen={isDatePickerOpen}
          ratingDropdownRef={ratingDropdownRef}
          datePickerRef={datePickerRef}
          onSearchChange={setSearchInput}
          onToggleRatingDropdown={() => {
            setIsDatePickerOpen(false);
            setIsRatingDropdownOpen((value) => !value);
          }}
          onToggleDatePicker={() => {
            setIsRatingDropdownOpen(false);
            setIsDatePickerOpen((value) => !value);
          }}
          onMajorCategoryChange={changeMajorCategory}
          onMiddleCategoryChange={changeMiddleCategory}
          onToggleRating={(value) => toggleDraftArrayValue("ratings", value)}
          onToggleAllRating={() => toggleAllDraftArrayValues("ratings", HOSPITAL_REVIEW_RATING_OPTIONS)}
          onVisibilityChange={(value) => setDraftFilters((prev) => ({ ...prev, visibilityStatus: value }))}
          onReportStatusChange={(value) => setDraftFilters((prev) => ({ ...prev, reportStatus: value }))}
          onBestChange={(value) => setDraftFilters((prev) => ({ ...prev, best: value }))}
          onMetricFieldChange={changeMetricField}
          onMetricMinChange={(value) =>
            setDraftFilters((prev) => ({ ...prev, metricMin: normalizeMetricBound(value) }))
          }
          onMetricMaxChange={(value) =>
            setDraftFilters((prev) => ({ ...prev, metricMax: normalizeMetricBound(value) }))
          }
          onApplyDateRange={applyDateRange}
          onApplyDatePreset={applyDatePreset}
          onApplyFilters={applyFilters}
          onResetFilters={resetFilters}
        />
      ) : (
        <HospitalReviewCommentsFilterPanel
          searchInput={searchInput}
          draftFilters={draftFilters}
          draftDateRange={draftDateRange}
          majorCategoryOptions={majorCategoryOptions}
          middleCategoryOptions={middleCategoryOptions}
          smallCategoryOptions={smallCategoryOptions}
          isDatePickerOpen={isDatePickerOpen}
          datePickerRef={datePickerRef}
          onSearchChange={setSearchInput}
          onToggleDatePicker={() => {
            setIsRatingDropdownOpen(false);
            setIsDatePickerOpen((value) => !value);
          }}
          onMajorCategoryChange={changeMajorCategory}
          onMiddleCategoryChange={changeMiddleCategory}
          onSmallCategoryChange={changeSmallCategory}
          onVisibilityChange={(value) => setDraftFilters((prev) => ({ ...prev, visibilityStatus: value }))}
          onReportStatusChange={(value) => setDraftFilters((prev) => ({ ...prev, reportStatus: value }))}
          onMetricMinChange={(value) =>
            setDraftFilters((prev) => ({ ...prev, metricMin: normalizeMetricBound(value) }))
          }
          onMetricMaxChange={(value) =>
            setDraftFilters((prev) => ({ ...prev, metricMax: normalizeMetricBound(value) }))
          }
          onApplyDateRange={applyDateRange}
          onApplyDatePreset={applyDatePreset}
          onApplyFilters={applyFilters}
          onResetFilters={resetFilters}
        />
      )}

      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      {activeBoard === "posts" ? (
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
          canUpdateStatus={canUpdateStatus}
          onToggleSort={toggleSort}

          onGoPage={setPage}
          onToggleRow={toggleRow}
          onToggleAllRows={toggleAllRows}
          onBulkVisibilityChange={requestBulkVisibilityChange}
          onRowVisibilityChange={requestRowVisibilityChange}
          onOpenDetail={openReviewDetail}
        />
      ) : (
        <HospitalReviewCommentsDataTable
          rows={commentRows}
          meta={meta}
          loading={loading}
          refreshing={refreshing}
          error={error}
          sortState={commentSortState}
          selectedIds={selectedIds}
          visibilityUpdatingIds={rowVisibilityUpdatingIds}
          bulkUpdating={bulkUpdating}
          canUpdateStatus={canUpdateStatus}
          onToggleSort={toggleCommentSort}

          onGoPage={setPage}
          onToggleRow={toggleRow}
          onToggleAllRows={toggleAllRows}
          onBulkVisibilityChange={requestBulkVisibilityChange}
          onRowVisibilityChange={requestRowVisibilityChange}
        />
      )}

      <Modal
        isOpen={isMetricRequiredModalOpen}
        onClose={() => setIsMetricRequiredModalOpen(false)}
        showCloseButton={false}
        className="mx-4 w-full max-w-md"
      >
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle>검색 조건 확인</ModalTitle>
          </ModalHeader>

          <ModalBody className="mt-5">
            <p className="text-sm leading-6 font-medium text-gray-800">지표 기준을 선택해주세요.</p>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="brand" onClick={() => setIsMetricRequiredModalOpen(false)}>
              확인
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>

      {canUpdateStatus ? (
        <VisibilityConfirmModal
          isOpen={Boolean(pendingVisibilityChange)}
          status={pendingVisibilityChange?.status}
          message={pendingVisibilityMessage}
          hiddenReasonValue={pendingVisibilityChange?.hiddenReason ?? ""}
          updating={pendingVisibilityUpdating}
          reasonInputId="hospital-review-hidden-reason"
          onHiddenReasonChange={updatePendingHiddenReason}
          onClose={closeVisibilityConfirmModal}
          onConfirm={() => void confirmVisibilityChange()}
        />
      ) : null}
    </div>
  );
}
