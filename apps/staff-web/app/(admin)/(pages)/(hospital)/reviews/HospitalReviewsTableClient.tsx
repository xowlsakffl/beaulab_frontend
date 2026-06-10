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

import { HospitalReviewCommentsDataTable } from "@/components/hospital-review/list/HospitalReviewCommentsDataTable";
import { HospitalReviewCommentsFilterPanel } from "@/components/hospital-review/list/HospitalReviewCommentsFilterPanel";
import { HospitalReviewsDataTable } from "@/components/hospital-review/list/HospitalReviewsDataTable";
import { HospitalReviewsFilterPanel } from "@/components/hospital-review/list/HospitalReviewsFilterPanel";
import { api } from "@/lib/common/api";
import { CATEGORY_DOMAINS, type CategoryApiItem } from "@/lib/common/category";
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
  board: HospitalReviewBoard;
  source: "bulk" | "row";
  ids: number[];
  status: "ACTIVE" | "INACTIVE";
  hiddenReason?: string;
} | null;

type HospitalReviewBoard = "posts" | "comments";

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
  const initialCommentSortStateRef = React.useRef<HospitalReviewCommentSortState | null>(null);
  const initialBoardRef = React.useRef<HospitalReviewBoard | null>(null);
  const hasFetchedRef = React.useRef(false);
  const requestKeyRef = React.useRef("");

  if (!initialTableStateRef.current) {
    const initialSearchParams = new URLSearchParams(searchParams.toString());

    initialTableStateRef.current = parseHospitalReviewsTableState(initialSearchParams);
    initialCommentSortStateRef.current = parseHospitalReviewCommentSortState(initialSearchParams);
    initialBoardRef.current = initialSearchParams.get("board") === "comments" ? "comments" : "posts";
  }

  const initialTableState = initialTableStateRef.current;
  const [activeBoard, setActiveBoard] = React.useState<HospitalReviewBoard>(initialBoardRef.current ?? "posts");
  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [isRatingDropdownOpen, setIsRatingDropdownOpen] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftFilters, setDraftFilters] = React.useState<HospitalReviewFilters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<HospitalReviewFilters>(initialTableState.filters);
  const [sortState, setSortState] = React.useState<HospitalReviewSortState>(initialTableState.sortState);
  const [commentSortState, setCommentSortState] = React.useState<HospitalReviewCommentSortState>(
    initialCommentSortStateRef.current ?? DEFAULT_HOSPITAL_REVIEW_COMMENT_SORT,
  );
  const [page, setPage] = React.useState(initialTableState.page);
  const [rows, setRows] = React.useState<HospitalReviewRow[]>([]);
  const [commentRows, setCommentRows] = React.useState<HospitalReviewCommentRow[]>([]);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isMetricRequiredModalOpen, setIsMetricRequiredModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [bulkUpdating, setBulkUpdating] = React.useState(false);
  const [majorCategoryItems, setMajorCategoryItems] = React.useState<CategoryApiItem[]>([]);
  const [middleCategoryItems, setMiddleCategoryItems] = React.useState<CategoryApiItem[]>([]);
  const [smallCategoryItems, setSmallCategoryItems] = React.useState<CategoryApiItem[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(() => new Set());
  const [rowVisibilityUpdatingIds, setRowVisibilityUpdatingIds] = React.useState<Set<number>>(() => new Set());
  const [pendingVisibilityChange, setPendingVisibilityChange] = React.useState<PendingVisibilityChange>(null);
  const ratingDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);
  const middleCategoryParentRef = React.useRef("");
  const smallCategoryParentRef = React.useRef("");

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

    return [
      { value: "", label: "전체" },
      ...middleCategoryItems.map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    ];
  }, [draftFilters.majorCategoryId, middleCategoryItems]);
  const smallCategoryOptions = React.useMemo<SelectOption[]>(() => {
    if (!draftFilters.middleCategoryId) {
      return [{ value: "", label: "중분류 선택" }];
    }

    return [
      { value: "", label: "전체" },
      ...smallCategoryItems.map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    ];
  }, [draftFilters.middleCategoryId, smallCategoryItems]);

  const fetchCategoryItems = React.useCallback(
    async (parentId?: string | number | null, perPage = 100): Promise<CategoryApiItem[]> => {
      const response = await api.get<CategoryApiItem[]>("/categories/selector", {
        domain: CATEGORY_DOMAINS.HOSPITAL_MEDICAL,
        status: ["ACTIVE"],
        per_page: perPage,
        ...(parentId !== undefined && parentId !== null && String(parentId) !== ""
          ? { parent_id: parentId }
          : { usage: config.categoryUsage }),
      });

      if (!isApiSuccess(response)) {
        throw new Error(response.error.message || "카테고리 필터를 불러오지 못했습니다.");
      }

      return response.data;
    },
    [config.categoryUsage],
  );

  const loadMiddleCategories = React.useCallback(
    async (parentId: string) => {
      middleCategoryParentRef.current = parentId;
      setMiddleCategoryItems([]);

      if (!parentId) return;

      try {
        const items = await fetchCategoryItems(parentId);
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

  const loadSmallCategories = React.useCallback(
    async (parentId: string) => {
      smallCategoryParentRef.current = parentId;
      setSmallCategoryItems([]);

      if (!parentId) return;

      try {
        const items = await fetchCategoryItems(parentId);
        if (smallCategoryParentRef.current === parentId) {
          setSmallCategoryItems(items);
        }
      } catch {
        if (smallCategoryParentRef.current === parentId) {
          setSmallCategoryItems([]);
        }
      }
    },
    [fetchCategoryItems],
  );

  React.useEffect(() => {
    let cancelled = false;

    async function fetchRootCategories() {
      try {
        const items = await fetchCategoryItems(null);
        if (cancelled) return;

        middleCategoryParentRef.current = "";
        smallCategoryParentRef.current = "";
        setMajorCategoryItems(items);
        setMiddleCategoryItems([]);
        setSmallCategoryItems([]);
      } catch {
        if (!cancelled) {
          setMajorCategoryItems([]);
          setMiddleCategoryItems([]);
          setSmallCategoryItems([]);
        }
      }
    }

    void fetchRootCategories();

    return () => {
      cancelled = true;
    };
  }, [fetchCategoryItems]);

  React.useEffect(() => {
    if (majorCategoryItems.length === 0 && middleCategoryItems.length === 0 && smallCategoryItems.length === 0) return;

    const hydrateCategorySelection = (filters: HospitalReviewFilters): HospitalReviewFilters => {
      if (filters.majorCategoryId || filters.middleCategoryId || filters.smallCategoryId || filters.categoryIds.length === 0) {
        return filters;
      }

      const selectedCategoryId = filters.categoryIds[0];
      const majorItem = majorCategoryItems.find((item) => String(item.id) === selectedCategoryId);
      if (majorItem) {
        return {
          ...filters,
          majorCategoryId: selectedCategoryId,
          middleCategoryId: "",
          smallCategoryId: "",
        };
      }

      const smallItem = smallCategoryItems.find((item) => String(item.id) === selectedCategoryId);
      if (smallItem) {
        const parentMiddleItem = middleCategoryItems.find((item) => Number(item.id) === Number(smallItem.parent_id));

        return {
          ...filters,
          majorCategoryId: parentMiddleItem?.parent_id ? String(parentMiddleItem.parent_id) : "",
          middleCategoryId: smallItem.parent_id ? String(smallItem.parent_id) : "",
          smallCategoryId: selectedCategoryId,
        };
      }

      const middleItem = middleCategoryItems.find((item) => String(item.id) === selectedCategoryId);
      if (!middleItem) return filters;

      return {
        ...filters,
        majorCategoryId: middleItem.parent_id ? String(middleItem.parent_id) : "",
        middleCategoryId: selectedCategoryId,
        smallCategoryId: "",
      };
    };

    setDraftFilters((prev) => hydrateCategorySelection(prev));
    setAppliedFilters((prev) => hydrateCategorySelection(prev));
  }, [majorCategoryItems, middleCategoryItems, smallCategoryItems]);

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
        const response = await api.get<HospitalReviewApiItem[]>("/hospital-reviews", query);

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
    [query, type],
  );

  const fetchComments = React.useCallback(
    async (manualRefresh = false) => {
      const requestKey = `${type}:comments:${JSON.stringify(commentQuery)}`;
      if (!manualRefresh && requestKeyRef.current === requestKey) return;
      requestKeyRef.current = requestKey;

      if (!hasFetchedRef.current) setLoading(true);
      else setRefreshing(true);
      if (manualRefresh) setRefreshing(true);

      setError(null);

      try {
        const response = await api.get<HospitalReviewCommentApiItem[]>("/hospital-review-comments", commentQuery);

        if (!isApiSuccess(response)) {
          setError(response.error.message || "후기 댓글 목록 조회에 실패했습니다.");
          return;
        }

        setCommentRows(response.data.map(normalizeHospitalReviewComment));
        setMeta((response.meta as DataTableMeta | null) ?? null);
        hasFetchedRef.current = true;
      } catch {
        setError("후기 댓글 목록 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [commentQuery, type],
  );

  React.useEffect(() => {
    if (activeBoard === "posts") {
      void fetchReviews();
    }
  }, [activeBoard, fetchReviews]);

  React.useEffect(() => {
    if (activeBoard === "comments") {
      void fetchComments();
    }
  }, [activeBoard, fetchComments]);

  React.useEffect(() => {
    setSelectedIds((prev) => {
      const activeRows = activeBoard === "comments" ? commentRows : rows;
      const selectableIds = new Set(activeRows
        .filter((row) => !row.visibilityChangeLocked)
        .map((row) => row.id));
      const next = new Set(Array.from(prev).filter((id) => selectableIds.has(id)));

      return next.size === prev.size ? prev : next;
    });
  }, [activeBoard, commentRows, rows]);

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

  const toggleDraftArrayValue = React.useCallback(
    (key: "ratings", value: string) => {
      setDraftFilters((prev) => {
        const exists = prev[key].includes(value);
        const nextValues = exists ? prev[key].filter((item) => item !== value) : [...prev[key], value];

        return { ...prev, [key]: nextValues };
      });
    },
    [],
  );

  const toggleAllDraftArrayValues = React.useCallback(
    (key: "ratings", options: CheckboxFilterOption[]) => {
      setDraftFilters((prev) => {
        const allValues = options.map((option) => option.value);
        const hasAll = allValues.length > 0 && allValues.every((value) => prev[key].includes(value));

        return { ...prev, [key]: hasAll ? [] : allValues };
      });
    },
    [],
  );

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
  }, [activeBoard, draftFilters, searchInput]);

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
    void loadMiddleCategories(value);
    void loadSmallCategories("");

    setDraftFilters((prev) => ({
      ...prev,
      majorCategoryId: value,
      middleCategoryId: "",
      smallCategoryId: "",
      categoryIds: value ? [value] : [],
    }));
  }, [loadMiddleCategories, loadSmallCategories]);

  const changeMiddleCategory = React.useCallback((value: string) => {
    void loadSmallCategories(value);

    setDraftFilters((prev) => {
      if (!prev.majorCategoryId) {
        return {
          ...prev,
          middleCategoryId: "",
          smallCategoryId: "",
          categoryIds: [],
        };
      }

      if (!value) {
        return {
          ...prev,
          middleCategoryId: "",
          smallCategoryId: "",
          categoryIds: prev.majorCategoryId ? [prev.majorCategoryId] : [],
        };
      }

      const middleItem = middleCategoryItems.find((item) => String(item.id) === value);
      const majorCategoryId = middleItem?.parent_id ? String(middleItem.parent_id) : prev.majorCategoryId;

      return {
        ...prev,
        majorCategoryId,
        middleCategoryId: value,
        smallCategoryId: "",
        categoryIds: [value],
      };
    });
  }, [loadSmallCategories, middleCategoryItems]);

  const changeSmallCategory = React.useCallback((value: string) => {
    setDraftFilters((prev) => {
      if (!prev.middleCategoryId) {
        return {
          ...prev,
          smallCategoryId: "",
          categoryIds: prev.majorCategoryId
            ? [prev.middleCategoryId || prev.majorCategoryId]
            : [],
        };
      }

      if (!value) {
        return {
          ...prev,
          smallCategoryId: "",
          categoryIds: [prev.middleCategoryId],
        };
      }

      return {
        ...prev,
        smallCategoryId: value,
        categoryIds: [value],
      };
    });
  }, []);

  const toggleSort = React.useCallback((field: HospitalReviewSortField) => {
    setSortState((prev) => nextHospitalReviewSortState(prev, field));
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const toggleCommentSort = React.useCallback((field: HospitalReviewCommentSortField) => {
    setCommentSortState((prev) => nextHospitalReviewCommentSortState(prev, field));
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const changeBoard = React.useCallback((board: HospitalReviewBoard) => {
    if (board === activeBoard) return;

    const nextFilters = board === "comments" ? resetHospitalReviewCommentFilters() : DEFAULT_HOSPITAL_REVIEW_FILTERS;

    requestKeyRef.current = "";
    hasFetchedRef.current = false;
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
    setRowVisibilityUpdatingIds(new Set());
    setPendingVisibilityChange(null);
    setError(null);
    setActionError(null);
    setMeta(null);
  }, [activeBoard]);

  const toggleRow = React.useCallback((row: HospitalReviewRow, checked: boolean) => {
    if (row.visibilityChangeLocked) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(row.id);
      else next.delete(row.id);
      return next;
    });
  }, []);

  const toggleCommentRow = React.useCallback((row: HospitalReviewCommentRow, checked: boolean) => {
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
      const activeRows = activeBoard === "comments" ? commentRows : rows;
      const selectableIds = activeRows
        .filter((row) => !row.visibilityChangeLocked)
        .map((row) => row.id);

      if (checked) {
        selectableIds.forEach((id) => next.add(id));
      } else {
        selectableIds.forEach((id) => next.delete(id));
      }

      return next;
    });
  }, [activeBoard, commentRows, rows]);

  const requestBulkVisibilityChange = React.useCallback((status: "ACTIVE" | "INACTIVE") => {
    if (selectedIds.size === 0) return;

    const activeRows = activeBoard === "comments" ? commentRows : rows;
    const currentRowsById = new Map(activeRows.map((row) => [row.id, row]));
    const ids = Array.from(selectedIds)
      .filter((id) => !currentRowsById.get(id)?.visibilityChangeLocked);
    if (ids.length === 0) return;

    setActionError(null);
    setPendingVisibilityChange({
      board: activeBoard,
      source: "bulk",
      ids,
      status,
      hiddenReason: "",
    });
  }, [activeBoard, commentRows, rows, selectedIds]);

  const requestRowVisibilityChange = React.useCallback((row: HospitalReviewRow, status: "ACTIVE" | "INACTIVE") => {
    if (row.visibilityChangeLocked || row.status === status) return;

    setActionError(null);
    setPendingVisibilityChange({
      board: "posts",
      source: "row",
      ids: [row.id],
      status,
      hiddenReason: "",
    });
  }, []);

  const requestCommentRowVisibilityChange = React.useCallback((row: HospitalReviewCommentRow, status: "ACTIVE" | "INACTIVE") => {
    if (row.visibilityChangeLocked || row.status === status) return;

    setActionError(null);
    setPendingVisibilityChange({
      board: "comments",
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

    const { board, source, ids, status, hiddenReason } = pendingVisibilityChange;
    const isCommentChange = board === "comments";
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
      const response = await api.patch<HospitalReviewVisibilityUpdateResponse>(
        isCommentChange ? "/hospital-review-comments/status" : "/hospital-reviews/status",
        payload,
      );

      if (!isApiSuccess(response)) {
        setActionError(response.error.message || `${isCommentChange ? "후기 댓글" : "후기"} 노출 상태 변경에 실패했습니다.`);
        return;
      }

      setPendingVisibilityChange(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      if (isCommentChange) {
        await fetchComments(true);
      } else {
        await fetchReviews(true);
      }
    } catch {
      setActionError(`${isCommentChange ? "후기 댓글" : "후기"} 노출 상태 변경 중 오류가 발생했습니다.`);
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
  }, [fetchComments, fetchReviews, pendingVisibilityChange]);

  const openReviewDetail = React.useCallback((row: HospitalReviewRow) => {
    const returnTo = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(`${config.listPath}/${row.id}?returnTo=${encodeURIComponent(returnTo)}`);
  }, [config.listPath, pathname, queryString, router]);

  React.useEffect(() => {
    rows.slice(0, 10).forEach((row) => {
      router.prefetch(`${config.listPath}/${row.id}`);
    });
  }, [config.listPath, router, rows]);

  const pendingVisibilityLabel = pendingVisibilityChange?.status === "ACTIVE" ? "노출" : "미노출";
  const pendingVisibilityTarget = pendingVisibilityChange?.board === "comments" ? "댓글" : "후기";
  const pendingVisibilityMessage = pendingVisibilityChange?.source === "row"
    ? `해당 ${pendingVisibilityTarget}을 ${pendingVisibilityLabel} 하시겠습니까?`
    : <>총 <span className="text-error-500">{pendingVisibilityChange?.ids.length ?? 0}</span>건을 {pendingVisibilityLabel}로 변경하시겠습니까?</>;
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
          onMetricMinChange={(value) => setDraftFilters((prev) => ({ ...prev, metricMin: normalizeMetricBound(value) }))}
          onMetricMaxChange={(value) => setDraftFilters((prev) => ({ ...prev, metricMax: normalizeMetricBound(value) }))}
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
          onMetricMinChange={(value) => setDraftFilters((prev) => ({ ...prev, metricMin: normalizeMetricBound(value) }))}
          onMetricMaxChange={(value) => setDraftFilters((prev) => ({ ...prev, metricMax: normalizeMetricBound(value) }))}
          onApplyDateRange={applyDateRange}
          onApplyDatePreset={applyDatePreset}
          onApplyFilters={applyFilters}
          onResetFilters={resetFilters}
        />
      )}

      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700   ">
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
          onToggleSort={toggleSort}
          onRefresh={() => void fetchReviews(true)}
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
          onToggleSort={toggleCommentSort}
          onRefresh={() => void fetchComments(true)}
          onGoPage={setPage}
          onToggleRow={toggleCommentRow}
          onToggleAllRows={toggleAllRows}
          onBulkVisibilityChange={requestBulkVisibilityChange}
          onRowVisibilityChange={requestCommentRowVisibilityChange}
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
            <p className="text-sm font-medium leading-6 text-gray-800 ">
              지표 기준을 선택해주세요.
            </p>
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="brand"
              onClick={() => setIsMetricRequiredModalOpen(false)}
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
            <p className="text-sm font-medium text-gray-800 ">
              {pendingVisibilityMessage}
            </p>

            {pendingVisibilityChange?.status === "INACTIVE" ? (
              <div className="mt-4">
                <label
                  htmlFor="hospital-review-hidden-reason"
                  className="mb-1.5 block text-sm font-medium text-gray-700 "
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
