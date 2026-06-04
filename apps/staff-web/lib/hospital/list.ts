import type { CheckboxFilterOption, DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

import { resolveMediaUrl, type MediaAsset } from "./detail";

export type HospitalApiItem = {
  id: number;
  name: string;
  department?: string;
  department_label?: string;
  departmentLabel?: string;
  email?: string | null;
  tel: string;
  view_count?: number;
  viewCount?: number;
  evaluation?: {
    count?: number;
    average_rating?: number;
    averageRating?: number;
  } | null;
  review_counts?: {
    surgery?: number;
    treatment?: number;
  } | null;
  reviewCounts?: {
    surgery?: number;
    treatment?: number;
  } | null;
  allow_status?: string;
  allowStatus?: string;
  status: string;
  account?: {
    id?: number;
    nickname?: string | null;
    email?: string | null;
    status?: string | null;
    last_login_at?: string | null;
    lastLoginAt?: string | null;
  } | null;
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
  department: string;
  departmentLabel: string;
  loginId: string;
  accountEmail: string;
  tel: string;
  viewCount: number;
  eventCount: number;
  consultationCount: number;
  evaluationCount: number;
  evaluationAverageRating: number;
  surgeryReviewCount: number;
  treatmentReviewCount: number;
  reviewStatus: string;
  accountStatus: string;
  hospitalStatus: string;
  lastLoginAt: string;
  isDormant: boolean;
  createdAt: string;
  updatedAt: string;
  logoUrl: string | null;
};

export type SortField =
  | "id"
  | "name"
  | "created_at"
  | "updated_at"
  | "view_count"
  | "status"
  | "allow_status"
  | "last_login_at"
  | "evaluation_count"
  | "evaluation_average_rating";
export type SortDirection = "asc" | "desc";

export type SortState = {
  field: SortField;
  direction: SortDirection;
  enabled: boolean;
};

export type Filters = {
  departments: string[];
  accountStatuses: string[];
  hospitalStatuses: string[];
  reviewStatuses: string[];
  dateRange: string;
  startDate: string;
  endDate: string;
};

export type HospitalsQuery = {
  q?: string;
  department?: string;
  account_status?: string;
  status?: string;
  allow_status?: string;
  start_date?: string;
  end_date?: string;
  sort: SortField;
  direction: SortDirection;
  per_page: number;
  page: number;
};

export const DEFAULT_FILTERS: Filters = {
  departments: [],
  accountStatuses: [],
  hospitalStatuses: [],
  reviewStatuses: [],
  dateRange: "",
  startDate: "",
  endDate: "",
};

export const DEFAULT_SORT: SortState = { field: "id", direction: "desc", enabled: true };
export const HOSPITALS_PER_PAGE = 10;

export const ACCOUNT_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "ACTIVE", label: "정상" },
  { value: "SUSPENDED", label: "정지" },
  { value: "BLOCKED", label: "차단" },
  { value: "WITHDRAWN", label: "탈퇴" },
];

export const HOSPITAL_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "ACTIVE", label: "정상" },
  { value: "SUSPENDED", label: "정지" },
  { value: "WITHDRAWN", label: "탈퇴" },
];

export const ALLOW_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "PENDING", label: "검수신청" },
  { value: "APPROVED", label: "검수완료" },
  { value: "REJECTED", label: "검수반려" },
];

export const HOSPITAL_DEPARTMENT_OPTIONS: CheckboxFilterOption[] = [
  { value: "PLASTIC_SURGERY", label: "성형외과" },
  { value: "DERMATOLOGY", label: "피부과" },
  { value: "CLINIC", label: "의원" },
  { value: "DENTISTRY", label: "치과" },
  { value: "OPHTHALMOLOGY", label: "안과" },
  { value: "KOREAN_MEDICINE", label: "한의원" },
  { value: "OTHER", label: "기타" },
];

export const DATE_PRESET_OPTIONS = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "recent7", label: "최근 7일" },
  { key: "recent30", label: "최근 30일" },
] as const satisfies readonly DatePresetOption[];

export type DatePresetKey = (typeof DATE_PRESET_OPTIONS)[number]["key"];
export type DateFilterKey = "created";

export function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatFilterDisplayDate(date: Date) {
  const year = String(date.getFullYear() % 100).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDateRange(range?: DateRange) {
  if (!range?.from) return "";

  const fromDate = formatFilterDisplayDate(range.from);
  if (!range.to) return fromDate;

  return `${fromDate} ~ ${formatFilterDisplayDate(range.to)}`;
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
  if (appliedFilters.departments.length > 0) query.department = appliedFilters.departments.join(",");
  if (appliedFilters.accountStatuses.length > 0) query.account_status = appliedFilters.accountStatuses.join(",");
  if (appliedFilters.hospitalStatuses.length > 0) query.status = appliedFilters.hospitalStatuses.join(",");
  if (appliedFilters.reviewStatuses.length > 0) query.allow_status = appliedFilters.reviewStatuses.join(",");
  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;

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
  const accountStatuses = (searchParams.get("account_status") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const hospitalStatuses = (searchParams.get("status") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const reviewStatuses = (searchParams.get("allow_status") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const departments = (searchParams.get("department") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const createdDateState = buildFilterDateState(startDate, endDate);

  const perPage = HOSPITALS_PER_PAGE;

  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const sortFieldParam = searchParams.get("sort");
  const sortDirectionParam = searchParams.get("direction");
  const allowedSortFields = new Set<SortField>([
    "id",
    "name",
    "created_at",
    "updated_at",
    "view_count",
    "status",
    "allow_status",
    "last_login_at",
    "evaluation_count",
    "evaluation_average_rating",
  ]);
  const sortField = sortFieldParam && allowedSortFields.has(sortFieldParam as SortField) ? (sortFieldParam as SortField) : DEFAULT_SORT.field;
  const sortDirection: SortDirection = sortDirectionParam === "asc" ? "asc" : "desc";

  return {
    searchKeyword: searchParams.get("q")?.trim() ?? "",
    filters: {
      departments,
      accountStatuses,
      hospitalStatuses,
      reviewStatuses,
      dateRange: createdDateState.label,
      startDate,
      endDate,
    },
    draftDateRange: createdDateState.range,
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
  const lastLoginRaw = item.account?.lastLoginAt ?? item.account?.last_login_at ?? "";
  const createdDate = createdRaw ? new Date(createdRaw) : null;
  const updatedDate = updatedRaw ? new Date(updatedRaw) : null;
  const lastLoginDate = lastLoginRaw ? new Date(lastLoginRaw) : null;
  const evaluation = item.evaluation ?? null;
  const reviewCounts = item.reviewCounts ?? item.review_counts ?? null;
  const lastLoginAt =
    lastLoginDate && !Number.isNaN(lastLoginDate.getTime())
      ? formatLocalDateTime(lastLoginDate)
      : "-";

  return {
    id: item.id,
    name: item.name,
    department: item.department ?? "UNKNOWN",
    departmentLabel: item.departmentLabel ?? item.department_label ?? labelHospitalDepartment(item.department ?? "UNKNOWN"),
    loginId: item.account?.nickname || "-",
    accountEmail: item.account?.email || item.email || "-",
    tel: item.tel,
    viewCount: item.viewCount ?? item.view_count ?? 0,
    eventCount: 0,
    consultationCount: 0,
    evaluationCount: evaluation?.count ?? 0,
    evaluationAverageRating: evaluation?.averageRating ?? evaluation?.average_rating ?? 0,
    surgeryReviewCount: reviewCounts?.surgery ?? 0,
    treatmentReviewCount: reviewCounts?.treatment ?? 0,
    reviewStatus: item.allowStatus ?? item.allow_status ?? "UNKNOWN",
    accountStatus: item.account?.status || "UNKNOWN",
    hospitalStatus: item.status,
    lastLoginAt,
    isDormant:
      lastLoginDate !== null &&
      !Number.isNaN(lastLoginDate.getTime()) &&
      Date.now() - lastLoginDate.getTime() > 30 * 24 * 60 * 60 * 1000,
    createdAt: createdDate && !Number.isNaN(createdDate.getTime()) ? formatLocalDate(createdDate) : "-",
    updatedAt: updatedDate && !Number.isNaN(updatedDate.getTime()) ? formatLocalDate(updatedDate) : "-",
    logoUrl: resolveMediaUrl(item.logo as MediaAsset | null),
  };
}

export function formatLocalDateTime(date: Date) {
  const yyyyMMdd = formatLocalDate(date);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${yyyyMMdd} ${hours}:${minutes}`;
}

export function labelHospitalDepartment(department: string) {
  if (department === "PLASTIC_SURGERY") return "성형외과";
  if (department === "DERMATOLOGY") return "피부과";
  if (department === "CLINIC") return "의원";
  if (department === "DENTISTRY") return "치과";
  if (department === "OPHTHALMOLOGY") return "안과";
  if (department === "KOREAN_MEDICINE") return "한의원";
  if (department === "OTHER") return "기타";
  return department;
}

export function labelApprovalStatus(status: string) {
  if (status === "ACTIVE") return "정상";
  if (status === "SUSPENDED") return "정지";
  if (status === "WITHDRAWN") return "탈퇴";
  return status;
}

export function labelAccountStatus(status: string) {
  if (status === "ACTIVE") return "정상";
  if (status === "SUSPENDED") return "정지";
  if (status === "BLOCKED") return "차단";
  if (status === "WITHDRAWN") return "탈퇴";
  if (status === "UNKNOWN") return "-";
  return status;
}

export function labelReviewStatus(status: string) {
  if (status === "PENDING") return "검수신청";
  if (status === "APPROVED") return "검수완료";
  if (status === "REJECTED") return "검수반려";
  return status;
}

export function buildHospitalsReturnToPath(pathname: string, query: HospitalsQuery) {
  const returnQuery = buildHospitalsQueryString(query);
  return returnQuery ? `${pathname}?${returnQuery}` : pathname;
}

export function buildHospitalsQueryString(query: HospitalsQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.department) params.set("department", query.department);
  if (query.account_status) params.set("account_status", query.account_status);
  if (query.status) params.set("status", query.status);
  if (query.allow_status) params.set("allow_status", query.allow_status);
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.sort !== DEFAULT_SORT.field) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_SORT.direction) params.set("direction", query.direction);
  if (query.per_page !== HOSPITALS_PER_PAGE) params.set("per_page", String(query.per_page));
  if (query.page !== 1) params.set("page", String(query.page));

  return params.toString();
}
