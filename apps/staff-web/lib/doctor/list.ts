import type { CheckboxFilterOption, DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

type MediaAsset = {
  path?: string | null;
  url?: string | null;
};

export type DoctorApiItem = {
  id: number;
  hospital_id: number;
  hospital_name?: string | null;
  name: string;
  gender?: string | null;
  position?: string | null;
  is_specialist?: boolean;
  career_started_at?: string | null;
  allow_status?: string | null;
  status?: string | null;
  view_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  profile_image?: MediaAsset | null;
};

export type DoctorRow = {
  id: number;
  hospitalName: string;
  name: string;
  genderLabel: string;
  position: string;
  isSpecialist: boolean;
  careerPeriodLabel: string;
  approvalStatus: string;
  operatingStatus: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  profileImageUrl: string | null;
};

export type SortField =
  | "id"
  | "name"
  | "gender"
  | "position"
  | "is_specialist"
  | "status"
  | "allow_status"
  | "created_at"
  | "updated_at"
  | "view_count";

export type SortDirection = "asc" | "desc";

export type SortState = {
  field: SortField;
  direction: SortDirection;
  enabled: boolean;
};

export type DoctorsQuery = {
  q?: string;
  status?: string;
  allow_status?: string;
  position?: string;
  start_date?: string;
  end_date?: string;
  updated_start_date?: string;
  updated_end_date?: string;
  sort: SortField;
  direction: SortDirection;
  per_page: number;
  page: number;
};

export type Filters = {
  operatingStatuses: string[];
  approvalStatuses: string[];
  positions: string[];
  dateRange: string;
  startDate: string;
  endDate: string;
  updatedDateRange: string;
  updatedStartDate: string;
  updatedEndDate: string;
};

export const DEFAULT_SORT: SortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

export const DEFAULT_FILTERS: Filters = {
  operatingStatuses: [],
  approvalStatuses: [],
  positions: [],
  dateRange: "",
  startDate: "",
  endDate: "",
  updatedDateRange: "",
  updatedStartDate: "",
  updatedEndDate: "",
};

export const DOCTOR_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "ACTIVE", label: "정상" },
  { value: "SUSPENDED", label: "정지" },
  { value: "INACTIVE", label: "비활성" },
];

export const DOCTOR_APPROVAL_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "PENDING", label: "검수 대기" },
  { value: "APPROVED", label: "검수 완료" },
  { value: "REJECTED", label: "검수 반려" },
];

export const DOCTOR_POSITION_OPTIONS: CheckboxFilterOption[] = [
  { value: "대표원장", label: "대표원장" },
  { value: "원장", label: "원장" },
  { value: "기타", label: "기타" },
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

function formatDateValue(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return formatLocalDate(date);
}

function resolveMediaUrl(media?: MediaAsset | null): string | null {
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

function parseLocalDate(value: string) {
  const ymdMatch = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
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

export function formatCareerPeriod(careerStartedAt?: string | null, now = new Date()) {
  if (!careerStartedAt) return "-";

  const startedAt = parseLocalDate(careerStartedAt);
  if (!startedAt) return "-";

  let totalMonths =
    (now.getFullYear() - startedAt.getFullYear()) * 12 +
    (now.getMonth() - startedAt.getMonth());

  if (now.getDate() < startedAt.getDate()) {
    totalMonths -= 1;
  }

  if (totalMonths < 0) {
    totalMonths = 0;
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  return `${years}년 ${months}개월`;
}

export function labelDoctorGender(gender?: string | null) {
  if (!gender) return "-";

  const raw = gender.trim();
  if (raw === "남" || raw === "여") return raw;

  const normalized = raw.toUpperCase();
  if (normalized === "M" || normalized === "MALE" || normalized === "MAN") return "남";
  if (normalized === "F" || normalized === "FEMALE" || normalized === "WOMAN") return "여";

  return raw || "-";
}

export function labelDoctorApprovalStatus(status?: string | null) {
  if (status === "PENDING") return "검수 대기";
  if (status === "APPROVED") return "검수 완료";
  if (status === "REJECTED") return "검수 반려";
  return status || "-";
}

export function labelDoctorOperatingStatus(status?: string | null) {
  if (status === "ACTIVE") return "정상";
  if (status === "SUSPENDED") return "정지";
  if (status === "INACTIVE") return "비활성";
  return status || "-";
}

export function normalizeDoctor(item: DoctorApiItem): DoctorRow {
  return {
    id: item.id,
    hospitalName: item.hospital_name?.trim() || "-",
    name: item.name,
    genderLabel: labelDoctorGender(item.gender),
    position: item.position?.trim() || "-",
    isSpecialist: Boolean(item.is_specialist),
    careerPeriodLabel: formatCareerPeriod(item.career_started_at),
    approvalStatus: item.allow_status || "",
    operatingStatus: item.status || "",
    createdAt: formatDateValue(item.created_at),
    updatedAt: formatDateValue(item.updated_at),
    viewCount: Number(item.view_count ?? 0),
    profileImageUrl: resolveMediaUrl(item.profile_image),
  };
}

export function nextSortState(prev: SortState, field: SortField): SortState {
  if (prev.field !== field) return { field, direction: "desc", enabled: true };
  if (prev.enabled && prev.direction === "desc") return { field, direction: "asc", enabled: true };
  if (prev.enabled && prev.direction === "asc") {
    return {
      field: DEFAULT_SORT.field,
      direction: DEFAULT_SORT.direction,
      enabled: false,
    };
  }

  return { field, direction: "desc", enabled: true };
}

export function parseDoctorsTableState(searchParams: URLSearchParams) {
  const operatingStatuses = (searchParams.get("status") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const approvalStatuses = (searchParams.get("allow_status") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const positions = (searchParams.get("position") ?? "")
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
  const perPage = Number.isFinite(parsedPerPage) && allowedPerPageValues.has(parsedPerPage)
    ? parsedPerPage
    : 15;

  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const allowedSortFields = new Set<SortField>([
    "id",
    "name",
    "gender",
    "position",
    "is_specialist",
    "status",
    "allow_status",
    "created_at",
    "updated_at",
    "view_count",
  ]);

  const sortFieldParam = searchParams.get("sort");
  const sortDirectionParam = searchParams.get("direction");
  const sortField = sortFieldParam && allowedSortFields.has(sortFieldParam as SortField)
    ? (sortFieldParam as SortField)
    : DEFAULT_SORT.field;
  const sortDirection: SortDirection = sortDirectionParam === "asc" ? "asc" : "desc";

  return {
    searchKeyword: searchParams.get("q")?.trim() ?? "",
    filters: {
      operatingStatuses,
      approvalStatuses,
      positions,
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

export function buildDoctorsQuery({
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
}): DoctorsQuery {
  const query: DoctorsQuery = {
    sort: sortState.enabled ? sortState.field : DEFAULT_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_SORT.direction,
    per_page: perPage,
    page,
  };

  const trimmedSearch = searchKeyword.trim();
  if (trimmedSearch) query.q = trimmedSearch;
  if (appliedFilters.operatingStatuses.length > 0) query.status = appliedFilters.operatingStatuses.join(",");
  if (appliedFilters.approvalStatuses.length > 0) query.allow_status = appliedFilters.approvalStatuses.join(",");
  if (appliedFilters.positions.length > 0) query.position = appliedFilters.positions.join(",");
  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;
  if (appliedFilters.updatedStartDate) query.updated_start_date = appliedFilters.updatedStartDate;
  if (appliedFilters.updatedEndDate) query.updated_end_date = appliedFilters.updatedEndDate;

  return query;
}

export function buildDoctorsQueryString(query: DoctorsQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.allow_status) params.set("allow_status", query.allow_status);
  if (query.position) params.set("position", query.position);
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.updated_start_date) params.set("updated_start_date", query.updated_start_date);
  if (query.updated_end_date) params.set("updated_end_date", query.updated_end_date);
  if (query.sort !== DEFAULT_SORT.field) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_SORT.direction) params.set("direction", query.direction);
  if (query.per_page !== 15) params.set("per_page", String(query.per_page));
  if (query.page !== 1) params.set("page", String(query.page));

  return params.toString();
}

export function buildDoctorsReturnToPath(pathname: string, query: DoctorsQuery) {
  const returnQuery = buildDoctorsQueryString(query);
  return returnQuery ? `${pathname}?${returnQuery}` : pathname;
}
