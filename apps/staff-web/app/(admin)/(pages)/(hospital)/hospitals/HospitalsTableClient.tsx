"use client";

import { Can } from "@/components/guard";
import { api } from "@/lib/api";
import { isApiSuccess } from "@beaulab/types";
import {
  Card,
  CheckboxFilterDropdown,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  SquarePlus,
  Download,
  SlidersHorizontal,
  Button,
  DataTable,
  DateRangeFilterDropdown,
  InputField,
  Select,
  StatusBadge,
  type CheckboxFilterOption,
  type DataTableColumn,
  type DataTableMeta,
  type DatePresetOption,
} from "@beaulab/ui-admin";
import Link from "next/link";
import React from "react";
import type { DateRange } from "react-day-picker";

type HospitalApiItem = {
  id: number;
  name: string;
  address: string;
  address_detail?: string;
  addressDetail?: string;
  tel: string;
  view_count?: number;
  viewCount?: number;
  allow_status?: string;
  allowStatus?: string;
  status: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  logo?: {
    path?: string | null;
    url?: string | null;
  } | null;
};

type HospitalRow = {
  id: number;
  name: string;
  address: string;
  addressDetail: string;
  tel: string;
  viewCount: number;
  reviewStatus: string;
  approvalStatus: string;
  createdAt: string;
  updatedAt: string;
  logoUrl: string | null;
};

type SortField = "id" | "name" | "created_at" | "updated_at" | "view_count" | "status" | "allow_status";
type SortDirection = "asc" | "desc";

type SortState = {
  field: SortField;
  direction: SortDirection;
  enabled: boolean;
};

type Filters = {
  approvalStatuses: string[];
  reviewStatuses: string[];
  dateRange: string;
  startDate: string;
  endDate: string;
  updatedDateRange: string;
  updatedStartDate: string;
  updatedEndDate: string;
};

type HospitalsQuery = {
  q?: string;
  status?: string;
  allow_status?: string;
  start_date?: string;
  end_date?: string;
  updated_start_date?: string;
  updated_end_date?: string;
  sort: SortField;
  direction: SortDirection;
  per_page: number;
  page: number;
};

const DEFAULT_FILTERS: Filters = {
  approvalStatuses: [],
  reviewStatuses: [],
  dateRange: "",
  startDate: "",
  endDate: "",
  updatedDateRange: "",
  updatedStartDate: "",
  updatedEndDate: "",
};

const DEFAULT_SORT: SortState = { field: "id", direction: "desc", enabled: true };

const APPROVAL_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "ACTIVE", label: "정상" },
  { value: "SUSPENDED", label: "정지" },
  { value: "WITHDRAWN", label: "탈퇴" },
];

const ALLOW_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "PENDING", label: "검수신청" },
  { value: "APPROVED", label: "검수완료" },
  { value: "REJECTED", label: "검수반려" },
];

const PER_PAGE_OPTIONS = [
  { value: "15", label: "15개" },
  { value: "30", label: "30개" },
  { value: "50", label: "50개" },
];

const DATE_PRESET_OPTIONS = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "recent7", label: "최근 7일" },
  { key: "recent30", label: "최근 30일" },
] as const satisfies readonly DatePresetOption[];

type DatePresetKey = (typeof DATE_PRESET_OPTIONS)[number]["key"];
type DateFilterKey = "created" | "updated";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function resolveMediaUrl(media?: HospitalApiItem["logo"]): string | null {
  const rawUrl = media?.url?.trim();
  if (rawUrl) return rawUrl;

  const rawPath = media?.path?.trim();
  if (!rawPath) return null;
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  if (!API_BASE_URL) return rawPath;
  if (rawPath.startsWith("/storage/")) return `${API_BASE_URL}${rawPath}`;
  if (rawPath.startsWith("storage/")) return `${API_BASE_URL}/${rawPath}`;
  if (rawPath.startsWith("/")) return `${API_BASE_URL}${rawPath}`;

  return `${API_BASE_URL}/storage/${rawPath}`;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateRange(range?: DateRange) {
  if (!range?.from) return "";

  const fromDate = formatLocalDate(range.from);
  if (!range.to) return fromDate;

  return `${fromDate} ~ ${formatLocalDate(range.to)}`;
}

function normalizeRangeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildPresetDateRange(preset: DatePresetKey): DateRange {
  const today = normalizeRangeDate(new Date());

  if (preset === "today") {
    return { from: today, to: today };
  }

  if (preset === "yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return { from: yesterday, to: yesterday };
  }

  const days = preset === "recent7" ? 6 : 29;
  const from = new Date(today);
  from.setDate(today.getDate() - days);

  return { from, to: today };
}

function mapDateRangeToFilter(range?: DateRange) {
  return {
    label: formatDateRange(range),
    startDate: range?.from ? formatLocalDate(range.from) : "",
    endDate: range?.to ? formatLocalDate(range.to) : "",
  };
}

function nextSortState(prev: SortState, field: SortField): SortState {
  if (prev.field !== field) return { field, direction: "desc", enabled: true };
  if (prev.enabled && prev.direction === "desc") return { field, direction: "asc", enabled: true };
  if (prev.enabled && prev.direction === "asc") return { field: "id", direction: "desc", enabled: false };
  return { field, direction: "desc", enabled: true };
}

function buildHospitalsQuery({
  searchKeyword,
  appliedFilters,
  sortState,
  perPage,
  page,
}: {
  searchKeyword: string;
  appliedFilters: Filters;
  sortState: SortState;
  perPage: number;
  page: number;
}): HospitalsQuery {
  const query: HospitalsQuery = {
    sort: sortState.enabled ? sortState.field : DEFAULT_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_SORT.direction,
    per_page: perPage,
    page,
  };

  const trimmedSearch = searchKeyword.trim();
  if (trimmedSearch) query.q = trimmedSearch;
  if (appliedFilters.approvalStatuses.length > 0) query.status = appliedFilters.approvalStatuses.join(",");
  if (appliedFilters.reviewStatuses.length > 0) query.allow_status = appliedFilters.reviewStatuses.join(",");
  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;
  if (appliedFilters.updatedStartDate) query.updated_start_date = appliedFilters.updatedStartDate;
  if (appliedFilters.updatedEndDate) query.updated_end_date = appliedFilters.updatedEndDate;

  return query;
}

function normalizeHospital(item: HospitalApiItem): HospitalRow {
  const createdRaw = item.createdAt ?? item.created_at ?? "";
  const updatedRaw = item.updatedAt ?? item.updated_at ?? "";
  const createdDate = createdRaw ? new Date(createdRaw) : null;
  const updatedDate = updatedRaw ? new Date(updatedRaw) : null;

  return {
    id: item.id,
    name: item.name,
    address: item.address,
    addressDetail: item.addressDetail ?? item.address_detail ?? "",
    tel: item.tel,
    viewCount: item.viewCount ?? item.view_count ?? 0,
    reviewStatus: item.allowStatus ?? item.allow_status ?? "UNKNOWN",
    approvalStatus: item.status,
    createdAt: createdDate && !Number.isNaN(createdDate.getTime()) ? formatLocalDate(createdDate) : "-",
    updatedAt: updatedDate && !Number.isNaN(updatedDate.getTime()) ? formatLocalDate(updatedDate) : "-",
    logoUrl: resolveMediaUrl(item.logo),
  };
}

function labelApprovalStatus(status: string) {
  if (status === "ACTIVE") return "정상";
  if (status === "SUSPENDED") return "정지";
  if (status === "WITHDRAWN") return "탈퇴";
  return status;
}

function labelReviewStatus(status: string) {
  if (status === "PENDING") return "검수신청";
  if (status === "APPROVED") return "검수완료";
  if (status === "REJECTED") return "검수반려";
  return status;
}

function renderSortMark(field: SortField, sortState: SortState) {
  if (!sortState.enabled || sortState.field !== field) return <ChevronsUpDown className="size-4" />;
  return sortState.direction === "desc" ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />;
}

function buildHospitalColumns({
  sortState,
  onToggleSort,
}: {
  sortState: SortState;
  onToggleSort: (field: SortField) => void;
}): DataTableColumn<HospitalRow>[] {
  const headerBaseClass = "px-3 py-3 text-left font-semibold text-theme-xs text-gray-600 dark:text-gray-300";
  const cellBaseClass = "px-3 py-4 text-start align-top dark:text-gray-200";
  const nowrapCellClass = `${cellBaseClass} whitespace-nowrap`;
  const spacedHeaderClass = `${headerBaseClass} lg:pl-3`;
  const spacedCellClass = `${cellBaseClass} lg:pl-3`;
  const spacedNowrapCellClass = `${nowrapCellClass} lg:pl-3`;

  return [
    {
      key: "id",
      headerClassName: `${headerBaseClass} lg:w-[40px]`,
      cellClassName: `${nowrapCellClass} lg:w-[40px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("id")} className="inline-flex items-center gap-1 px-0 text-xs">
          ID <span className="text-xs text-gray-400">{renderSortMark("id", sortState)}</span>
        </Button>
      ),
      render: (row) => row.id,
    },
    {
      key: "name",
      headerClassName: `${headerBaseClass} lg:w-[150px]`,
      cellClassName: `${cellBaseClass} lg:w-[150px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("name")} className="inline-flex items-center gap-1 px-0 text-xs">
          병의원명 <span className="text-xs text-gray-400">{renderSortMark("name", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo domains come from runtime API/storage configuration
            <img
              src={row.logoUrl}
              alt=""
              className="h-6 w-6 shrink-0 rounded-md border border-gray-200 object-cover dark:border-white/[0.08]"
            />
          ) : null}
          <span className="block truncate font-medium text-gray-800 dark:text-white/90" title={row.name}>
            {row.name}
          </span>
        </div>
      ),
    },
    {
      key: "tel",
      headerClassName: `${spacedHeaderClass} lg:w-[116px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[116px]`,
      header: "대표 연락처",
      render: (row) => row.tel,
    },
    {
      key: "address",
      headerClassName: `${spacedHeaderClass} lg:w-[200px]`,
      cellClassName: `${spacedCellClass} lg:w-[200px]`,
      header: "주소",
      render: (row) => (
        <div className="whitespace-pre-line">
          <div>{row.address || "-"}</div>
          {row.addressDetail ? <div className="text-gray-500 dark:text-gray-400">{row.addressDetail}</div> : null}
        </div>
      ),
    },
    {
      key: "approvalStatus",
      headerClassName: `${spacedHeaderClass} lg:w-[72px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[72px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("status")} className="inline-flex items-center gap-1 px-0 text-xs">
          승인상태 <span className="text-xs text-gray-400">{renderSortMark("status", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <StatusBadge size="sm" color={row.approvalStatus === "ACTIVE" ? "success" : row.approvalStatus === "SUSPENDED" ? "warning" : "error"}>
          {labelApprovalStatus(row.approvalStatus)}
        </StatusBadge>
      ),
    },
    {
      key: "reviewStatus",
      headerClassName: `${spacedHeaderClass} lg:w-[72px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[72px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("allow_status")} className="inline-flex items-center gap-1 px-0 text-xs">
          검수 상태 <span className="text-xs text-gray-400">{renderSortMark("allow_status", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <StatusBadge size="sm" color={row.reviewStatus === "APPROVED" ? "success" : row.reviewStatus === "PENDING" ? "warning" : "error"}>
          {labelReviewStatus(row.reviewStatus)}
        </StatusBadge>
      ),
    },
    {
      key: "viewCount",
      headerClassName: `${spacedHeaderClass} lg:w-[60px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[60px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("view_count")} className="inline-flex items-center gap-1 px-0 text-xs">
          조회수 <span className="text-xs text-gray-400">{renderSortMark("view_count", sortState)}</span>
        </Button>
      ),
      render: (row) => row.viewCount.toLocaleString(),
    },
    {
      key: "updatedAt",
      headerClassName: `${spacedHeaderClass} lg:w-[82px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[82px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("updated_at")} className="inline-flex items-center gap-1 px-0 text-xs">
          수정일 <span className="text-xs text-gray-400">{renderSortMark("updated_at", sortState)}</span>
        </Button>
      ),
      render: (row) => row.updatedAt,
    },
    {
      key: "createdAt",
      headerClassName: `${spacedHeaderClass} lg:w-[82px]`,
      cellClassName: `${spacedNowrapCellClass} lg:w-[82px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("created_at")} className="inline-flex items-center gap-1 px-0 text-xs">
          등록일 <span className="text-xs text-gray-400">{renderSortMark("created_at", sortState)}</span>
        </Button>
      ),
      render: (row) => row.createdAt,
    },
  ];
}

export default function HospitalsTableClient() {
  const [searchInput, setSearchInput] = React.useState("");
  const [searchKeyword, setSearchKeyword] = React.useState("");

  const [isFilterOpen, setIsFilterOpen] = React.useState(true);
  const [isFilterOverflowVisible, setIsFilterOverflowVisible] = React.useState(true);
  const [filterPanelHeight, setFilterPanelHeight] = React.useState("auto");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = React.useState(false);
  const [isReviewDropdownOpen, setIsReviewDropdownOpen] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [isUpdatedDatePickerOpen, setIsUpdatedDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>();
  const [draftUpdatedDateRange, setDraftUpdatedDateRange] = React.useState<DateRange | undefined>();
  const [draftFilters, setDraftFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [resetKey, setResetKey] = React.useState(0);
  const statusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const reviewDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);
  const updatedDatePickerRef = React.useRef<HTMLDivElement | null>(null);
  const filterPanelContentRef = React.useRef<HTMLDivElement | null>(null);
  const filterPanelAnimationFrameRef = React.useRef<number | null>(null);
  const hasMountedFilterPanelRef = React.useRef(false);

  const [sortState, setSortState] = React.useState<SortState>(DEFAULT_SORT);
  const [perPage, setPerPage] = React.useState(15);
  const [page, setPage] = React.useState(1);

  const [rows, setRows] = React.useState<HospitalRow[]>([]);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const requestKeyRef = React.useRef("");
  const hasFetchedRef = React.useRef(false);

  const query = React.useMemo(
    () =>
      buildHospitalsQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        perPage,
        page,
      }),
    [appliedFilters, page, perPage, searchKeyword, sortState],
  );

  const fetchHospitals = React.useCallback(
    async (manualRefresh = false) => {
      const requestKey = JSON.stringify(query);
      if (!manualRefresh && requestKeyRef.current === requestKey) return;
      requestKeyRef.current = requestKey;

      if (!hasFetchedRef.current) setLoading(true);
      else setRefreshing(true);
      if (manualRefresh) setRefreshing(true);

      setError(null);

      try {
        const response = await api.get<HospitalApiItem[]>("/hospitals", query);
        if (!isApiSuccess(response)) {
          setError(response.error.message || "병의원 목록 조회에 실패했습니다.");
          return;
        }

        setRows(response.data.map(normalizeHospital));
        setMeta((response.meta as DataTableMeta | null) ?? null);
        hasFetchedRef.current = true;
      } catch {
        setError("병의원 목록 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [query],
  );

  React.useEffect(() => {
    fetchHospitals(false);
  }, [fetchHospitals]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearchKeyword(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  React.useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!statusDropdownRef.current?.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (!reviewDropdownRef.current?.contains(event.target as Node)) {
        setIsReviewDropdownOpen(false);
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

  React.useLayoutEffect(() => {
    const panel = filterPanelContentRef.current;

    if (!hasMountedFilterPanelRef.current) {
      hasMountedFilterPanelRef.current = true;
      setFilterPanelHeight(isFilterOpen ? "auto" : "0px");
      setIsFilterOverflowVisible(isFilterOpen);
      return;
    }

    if (!panel) return;

    if (filterPanelAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(filterPanelAnimationFrameRef.current);
      filterPanelAnimationFrameRef.current = null;
    }

    const nextHeight = `${panel.scrollHeight}px`;
    setIsFilterOverflowVisible(false);

    if (isFilterOpen) {
      setFilterPanelHeight("0px");
      filterPanelAnimationFrameRef.current = window.requestAnimationFrame(() => {
        setFilterPanelHeight(nextHeight);
        filterPanelAnimationFrameRef.current = null;
      });
      return;
    }

    setFilterPanelHeight(nextHeight);
    filterPanelAnimationFrameRef.current = window.requestAnimationFrame(() => {
      setFilterPanelHeight("0px");
      filterPanelAnimationFrameRef.current = null;
    });

    return () => {
      if (filterPanelAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(filterPanelAnimationFrameRef.current);
        filterPanelAnimationFrameRef.current = null;
      }
    };
  }, [isFilterOpen]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters({
      approvalStatuses: [...draftFilters.approvalStatuses],
      reviewStatuses: [...draftFilters.reviewStatuses],
      dateRange: draftFilters.dateRange,
      startDate: draftFilters.startDate,
      endDate: draftFilters.endDate,
      updatedDateRange: draftFilters.updatedDateRange,
      updatedStartDate: draftFilters.updatedStartDate,
      updatedEndDate: draftFilters.updatedEndDate,
    });
  };

  const resetFilters = (applyNow = true) => {
    setDraftFilters(DEFAULT_FILTERS);
    setDraftDateRange(undefined);
    setDraftUpdatedDateRange(undefined);
    setIsDatePickerOpen(false);
    setIsUpdatedDatePickerOpen(false);
    setResetKey((prev) => prev + 1);
    if (applyNow) {
      setPage(1);
      setAppliedFilters(DEFAULT_FILTERS);
    }
  };

  const toggleFilters = () => {
    setIsFilterOpen((prev) => !prev);
  };

  const handleFilterPanelTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== "height") return;
    if (!isFilterOpen) return;

    setFilterPanelHeight("auto");
    setIsFilterOverflowVisible(true);
  };

  const toggleReviewStatus = (value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.reviewStatuses.includes(value);
      return {
        ...prev,
        reviewStatuses: exists
          ? prev.reviewStatuses.filter((item) => item !== value)
          : [...prev.reviewStatuses, value],
      };
    });
  };

  const toggleApprovalStatus = (value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.approvalStatuses.includes(value);
      return {
        ...prev,
        approvalStatuses: exists
          ? prev.approvalStatuses.filter((item) => item !== value)
          : [...prev.approvalStatuses, value],
      };
    });
  };

  const toggleAllApprovalStatus = () => {
    setDraftFilters((prev) => ({
      ...prev,
      approvalStatuses:
        prev.approvalStatuses.length === APPROVAL_STATUS_OPTIONS.length
          ? []
          : APPROVAL_STATUS_OPTIONS.map((item) => item.value),
    }));
  };

  const toggleAllReviewStatus = () => {
    setDraftFilters((prev) => ({
      ...prev,
      reviewStatuses:
        prev.reviewStatuses.length === ALLOW_STATUS_OPTIONS.length
          ? []
          : ALLOW_STATUS_OPTIONS.map((item) => item.value),
    }));
  };

  const applyDateRange = (
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
  };

  const applyDatePreset = (key: DateFilterKey, preset: DatePresetKey) => {
    applyDateRange(key, buildPresetDateRange(preset), { closePicker: true });
  };

  const toggleSort = React.useCallback((field: SortField) => {
    setPage(1);
    setSortState((prev) => nextSortState(prev, field));
  }, []);

  const shouldAllowFilterOverflow =
    isFilterOverflowVisible || isStatusDropdownOpen || isReviewDropdownOpen || isDatePickerOpen || isUpdatedDatePickerOpen;

  const columns = React.useMemo(
    () => buildHospitalColumns({ sortState, onToggleSort: toggleSort }),
    [sortState, toggleSort],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full">
          <InputField
              key={`search-${resetKey}`}
              defaultValue={searchInput}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchInput(event.target.value)}
              placeholder="ID, 병의원명, 연락처, 주소 검색"
              className="bg-white dark:bg-gray-800"
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <Button
              type="button"
              onClick={toggleFilters}
              variant="outline"
              size="sm"
              className={[
                "h-11 border-brand-500 px-5",
                isFilterOpen
                    ? "bg-brand-500 text-white hover:bg-brand-600"
                    : "text-brand-500 hover:bg-gray-100",
              ].join(" ")}
          >
            <SlidersHorizontal className="size-5" />
            <span>필터</span>
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-11 border-brand-500 px-5 text-brand-500 hover:bg-gray-100 dark:hover:bg-white/[0.06]">
            <Download className="size-5" />
            <span>다운로드</span>
          </Button>
          <Can permission="beaulab.hospital.create">
            <Link href="/hospitals/new">
              <Button type="button" variant="brand" size="sm" className="h-11 px-5">
                <SquarePlus className="size-5" />
                <span>병의원 등록</span>
              </Button>
            </Link>
          </Can>
        </div>
      </div>
      <Card className="rounded-xl p-0 dark:border-white/[0.05]">
        <Button
          type="button"
          variant="ghost"
          onClick={toggleFilters}
          className="flex h-11 w-full items-center justify-between rounded-none px-3 text-left text-sm font-medium text-gray-700 dark:bg-transparent dark:text-white/90"
        >
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">필터</h3>
          <ChevronDown className={["size-4 transition-transform", isFilterOpen ? "rotate-180" : "rotate-0"].join(" ")} />
        </Button>

        <div
          onTransitionEnd={handleFilterPanelTransitionEnd}
          className={[
            "transition-[height,opacity] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            isFilterOpen ? "opacity-100" : "opacity-0",
            shouldAllowFilterOverflow ? "overflow-visible" : "overflow-hidden",
          ].join(" ")}
          style={{ height: filterPanelHeight }}
        >
          <div ref={filterPanelContentRef}>
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4">
              <CheckboxFilterDropdown
                label="승인상태"
                containerRef={statusDropdownRef}
                selectedValues={draftFilters.approvalStatuses}
                options={APPROVAL_STATUS_OPTIONS}
                isOpen={isStatusDropdownOpen}
                onToggleOpen={() => setIsStatusDropdownOpen((prev) => !prev)}
                onToggleValue={toggleApprovalStatus}
                onToggleAll={toggleAllApprovalStatus}
              />
              <CheckboxFilterDropdown
                label="검수 상태"
                containerRef={reviewDropdownRef}
                selectedValues={draftFilters.reviewStatuses}
                options={ALLOW_STATUS_OPTIONS}
                isOpen={isReviewDropdownOpen}
                onToggleOpen={() => setIsReviewDropdownOpen((prev) => !prev)}
                onToggleValue={toggleReviewStatus}
                onToggleAll={toggleAllReviewStatus}
              />
              <DateRangeFilterDropdown
                label="등록일"
                containerRef={datePickerRef}
                value={draftFilters.dateRange}
                placeholder="등록일 기간 선택"
                selected={draftDateRange}
                isOpen={isDatePickerOpen}
                presetOptions={DATE_PRESET_OPTIONS}
                onToggleOpen={() => {
                  setIsUpdatedDatePickerOpen(false);
                  setIsDatePickerOpen((prev) => !prev);
                }}
                onSelect={(nextRange) => applyDateRange("created", nextRange)}
                onPresetSelect={(presetKey) => applyDatePreset("created", presetKey as DatePresetKey)}
                onReset={() => applyDateRange("created", undefined, { closePicker: true })}
                onConfirm={() => setIsDatePickerOpen(false)}
              />
              <DateRangeFilterDropdown
                label="수정일"
                containerRef={updatedDatePickerRef}
                value={draftFilters.updatedDateRange}
                placeholder="수정일 기간 선택"
                selected={draftUpdatedDateRange}
                isOpen={isUpdatedDatePickerOpen}
                presetOptions={DATE_PRESET_OPTIONS}
                onToggleOpen={() => {
                  setIsDatePickerOpen(false);
                  setIsUpdatedDatePickerOpen((prev) => !prev);
                }}
                onSelect={(nextRange) => applyDateRange("updated", nextRange)}
                onPresetSelect={(presetKey) => applyDatePreset("updated", presetKey as DatePresetKey)}
                onReset={() => applyDateRange("updated", undefined, { closePicker: true })}
                onConfirm={() => setIsUpdatedDatePickerOpen(false)}
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-3 pb-3">
              <Button type="button" variant="brand" onClick={applyFilters} size="sm" className="h-10 px-5">
                필터 적용
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => resetFilters(true)}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-300"
              >
                필터 초기화
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <DataTable
        title="병의원 목록"
        description="종합검색은 입력 시 자동 반영되며, 필터는 '필터 적용' 버튼으로 적용됩니다."
        tableClassName="min-w-[860px] w-full lg:min-w-0 lg:table-fixed"
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        loading={loading}
        refreshing={refreshing}
        error={error}
        meta={meta}
        onRefresh={() => fetchHospitals(true)}
        onGoPage={(nextPage) => setPage(nextPage)}
        rightActions={
          <div className="flex items-center gap-2">
            <Select
              defaultValue={String(perPage)}
              options={PER_PAGE_OPTIONS}
              showPlaceholderOption={false}
              onChange={(value) => {
                setPage(1);
                setPerPage(Number(value));
              }}
              placeholder="갯수를 선택하세요."
              className="w-[70px] px-2 text-xs"
            />
          </div>
        }
        emptyText="조건에 맞는 병의원이 없습니다."
      />
    </div>
  );
}
