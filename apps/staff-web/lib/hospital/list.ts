import type { CheckboxFilterOption, DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

import { resolveMediaUrl, type MediaAsset } from "./form";

export type HospitalApiItem = {
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

export type HospitalRow = {
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

export type SortField = "id" | "name" | "created_at" | "updated_at" | "view_count" | "status" | "allow_status";
export type SortDirection = "asc" | "desc";

export type SortState = {
  field: SortField;
  direction: SortDirection;
  enabled: boolean;
};

export type Filters = {
  approvalStatuses: string[];
  reviewStatuses: string[];
  dateRange: string;
  startDate: string;
  endDate: string;
  updatedDateRange: string;
  updatedStartDate: string;
  updatedEndDate: string;
};

export type HospitalsQuery = {
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

export const DEFAULT_FILTERS: Filters = {
  approvalStatuses: [],
  reviewStatuses: [],
  dateRange: "",
  startDate: "",
  endDate: "",
  updatedDateRange: "",
  updatedStartDate: "",
  updatedEndDate: "",
};

export const DEFAULT_SORT: SortState = { field: "id", direction: "desc", enabled: true };

export const APPROVAL_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "ACTIVE", label: "정상" },
  { value: "SUSPENDED", label: "정지" },
  { value: "WITHDRAWN", label: "탈퇴" },
];

export const ALLOW_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "PENDING", label: "검수신청" },
  { value: "APPROVED", label: "검수완료" },
  { value: "REJECTED", label: "검수반려" },
];

export const PER_PAGE_OPTIONS = [
  { value: "15", label: "15개" },
  { value: "30", label: "30개" },
  { value: "50", label: "50개" },
];

export const DATE_PRESET_OPTIONS = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "recent7", label: "최근 7일" },
  { key: "recent30", label: "최근 30일" },
] as const satisfies readonly DatePresetOption[];

export type DatePresetKey = (typeof DATE_PRESET_OPTIONS)[number]["key"];
export type DateFilterKey = "created" | "updated";

export function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDateRange(range?: DateRange) {
  if (!range?.from) return "";

  const fromDate = formatLocalDate(range.from);
  if (!range.to) return fromDate;

  return `${fromDate} ~ ${formatLocalDate(range.to)}`;
}

export function normalizeRangeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function buildPresetDateRange(preset: DatePresetKey): DateRange {
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

export function mapDateRangeToFilter(range?: DateRange) {
  return {
    label: formatDateRange(range),
    startDate: range?.from ? formatLocalDate(range.from) : "",
    endDate: range?.to ? formatLocalDate(range.to) : "",
  };
}

export function nextSortState(prev: SortState, field: SortField): SortState {
  if (prev.field !== field) return { field, direction: "desc", enabled: true };
  if (prev.enabled && prev.direction === "desc") return { field, direction: "asc", enabled: true };
  if (prev.enabled && prev.direction === "asc") return { field: "id", direction: "desc", enabled: false };
  return { field, direction: "desc", enabled: true };
}

export function buildHospitalsQuery({
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

export function parseDateParam(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedDate = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return undefined;
  }

  return parsedDate;
}

export function buildFilterDateState(startDate: string, endDate: string) {
  const from = startDate ? parseDateParam(startDate) : undefined;
  const to = endDate ? parseDateParam(endDate) : undefined;
  const range = from || to ? { from: from ?? to, to: to ?? from } : undefined;

  return {
    range,
    label: formatDateRange(range),
  };
}

export function parseHospitalsTableState(searchParams: URLSearchParams) {
  const approvalStatuses = (searchParams.get("status") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const reviewStatuses = (searchParams.get("allow_status") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const updatedStartDate = searchParams.get("updated_start_date") ?? "";
  const updatedEndDate = searchParams.get("updated_end_date") ?? "";
  const createdDateState = buildFilterDateState(startDate, endDate);
  const updatedDateState = buildFilterDateState(updatedStartDate, updatedEndDate);

  const parsedPerPage = Number(searchParams.get("per_page"));
  const allowedPerPageValues = new Set(PER_PAGE_OPTIONS.map((option) => Number(option.value)));
  const perPage = Number.isFinite(parsedPerPage) && allowedPerPageValues.has(parsedPerPage) ? parsedPerPage : 15;

  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const sortFieldParam = searchParams.get("sort");
  const sortDirectionParam = searchParams.get("direction");
  const allowedSortFields = new Set<SortField>(["id", "name", "created_at", "updated_at", "view_count", "status", "allow_status"]);
  const sortField = sortFieldParam && allowedSortFields.has(sortFieldParam as SortField) ? (sortFieldParam as SortField) : DEFAULT_SORT.field;
  const sortDirection: SortDirection = sortDirectionParam === "asc" ? "asc" : "desc";

  return {
    searchKeyword: searchParams.get("q")?.trim() ?? "",
    filters: {
      approvalStatuses,
      reviewStatuses,
      dateRange: createdDateState.label,
      startDate,
      endDate,
      updatedDateRange: updatedDateState.label,
      updatedStartDate,
      updatedEndDate,
    },
    draftDateRange: createdDateState.range,
    draftUpdatedDateRange: updatedDateState.range,
    sortState: {
      field: sortField,
      direction: sortDirection,
      enabled: Boolean(sortFieldParam || sortDirectionParam),
    },
    perPage,
    page,
  };
}

export function normalizeHospital(item: HospitalApiItem): HospitalRow {
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
    logoUrl: resolveMediaUrl(item.logo as MediaAsset | null),
  };
}

export function labelApprovalStatus(status: string) {
  if (status === "ACTIVE") return "정상";
  if (status === "SUSPENDED") return "정지";
  if (status === "WITHDRAWN") return "탈퇴";
  return status;
}

export function labelReviewStatus(status: string) {
  if (status === "PENDING") return "검수신청";
  if (status === "APPROVED") return "검수완료";
  if (status === "REJECTED") return "검수반려";
  return status;
}

export function buildHospitalsReturnToPath(pathname: string, query: HospitalsQuery) {
  const returnParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    returnParams.set(key, String(value));
  });

  const returnQuery = returnParams.toString();
  return returnQuery ? `${pathname}?${returnQuery}` : pathname;
}
