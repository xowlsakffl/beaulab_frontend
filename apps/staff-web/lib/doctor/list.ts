import type { CheckboxFilterOption, DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

type MediaAsset = {
  path?: string | null;
  url?: string | null;
};

export type DoctorSpecialist = {
  code?: string | null;
  label?: string | null;
};

export type DoctorApiItem = {
  id: number;
  hospital_id: number;
  hospital_name?: string | null;
  name: string;
  gender?: string | null;
  position?: string | null;
  specialist?: DoctorSpecialist | null;
  career_started_at?: string | null;
  license_number?: string | null;
  allow_status?: string | null;
  review_count?: number | null;
  consultation_count?: number | null;
  created_at?: string | null;
  profile_image?: MediaAsset | null;
  categories?: DoctorCategory[] | null;
};

export type DoctorCategory = {
  name?: string | null;
};

export type DoctorRow = {
  id: number;
  hospitalName: string;
  name: string;
  genderLabel: string;
  position: string;
  specialistCode: string;
  specialistLabel: string;
  licenseNumber: string;
  categoryNames: string[];
  careerPeriodLabel: string;
  careerYears: number | null;
  approvalStatus: string;
  createdAt: string;
  reviewCount: number;
  consultationCount: number;
  profileImageUrl: string | null;
};

export type SortField =
  | "id"
  | "name"
  | "gender"
  | "position"
  | "specialist_field"
  | "allow_status"
  | "career_years"
  | "review_count"
  | "consultation_count"
  | "created_at";

export type SortDirection = "asc" | "desc";

export type SortState = {
  field: SortField;
  direction: SortDirection;
  enabled: boolean;
};

export type DoctorsQuery = {
  q?: string;
  allow_status?: string;
  position?: string;
  specialist_field?: string;
  category_ids?: string;
  metric?: string;
  metric_min?: number;
  metric_max?: number;
  start_date?: string;
  end_date?: string;
  sort: SortField;
  direction: SortDirection;
  per_page: number;
  page: number;
};

export type Filters = {
  approvalStatuses: string[];
  positions: string[];
  specialistFields: string[];
  categoryIds: string[];
  metric: string;
  metricMin: string;
  metricMax: string;
  dateRange: string;
  startDate: string;
  endDate: string;
};

export const DEFAULT_SORT: SortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

export const DEFAULT_FILTERS: Filters = {
  approvalStatuses: [],
  positions: [],
  specialistFields: [],
  categoryIds: [],
  metric: "",
  metricMin: "",
  metricMax: "",
  dateRange: "",
  startDate: "",
  endDate: "",
};

export const DOCTORS_PER_PAGE = 10;

export const DOCTOR_APPROVAL_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "PENDING", label: "검수 대기" },
  { value: "APPROVED", label: "검수 완료" },
  { value: "REJECTED", label: "검수 반려" },
];

export const DOCTOR_POSITION_OPTIONS: CheckboxFilterOption[] = [
  { value: "대표원장", label: "대표원장" },
  { value: "원장", label: "원장" },
];

export const DOCTOR_METRIC_OPTIONS = [
  { value: "", label: "선택" },
  { value: "career_years", label: "경력기간" },
  { value: "review_count", label: "후기수" },
  { value: "consultation_count", label: "상담수" },
] as const;

export const DOCTOR_SPECIALIST_FIELD_OPTIONS = [
  { value: "NONE", label: "선택안함" },
  { value: "PLASTIC_SURGERY", label: "성형외과" },
  { value: "SURGERY", label: "외과" },
  { value: "OTOLARYNGOLOGY", label: "이비인후과" },
  { value: "FAMILY_MEDICINE", label: "가정의학과" },
  { value: "OBSTETRICS_GYNECOLOGY", label: "산부인과" },
  { value: "ORAL_MAXILLOFACIAL_SURGERY", label: "구강악안면외과" },
  { value: "ANESTHESIOLOGY_PAIN_MEDICINE", label: "마취통증의학과" },
  { value: "KOREAN_MEDICINE", label: "한의학과" },
  { value: "DENTISTRY", label: "치과" },
  { value: "ORTHODONTICS", label: "치과교정과" },
  { value: "DERMATOLOGY", label: "피부과" },
  { value: "OPHTHALMOLOGY", label: "안과" },
  { value: "INTERNAL_MEDICINE", label: "내과" },
  { value: "NEUROLOGY", label: "신경과" },
  { value: "ORTHOPEDICS", label: "정형외과" },
  { value: "NEUROSURGERY", label: "신경외과" },
  { value: "THORACIC_SURGERY", label: "흉부외과" },
  { value: "PEDIATRICS", label: "소아청소년과" },
  { value: "UROLOGY", label: "비뇨의학과" },
  { value: "RADIOLOGY", label: "영상의학과" },
  { value: "EMERGENCY_MEDICINE", label: "응급의학과" },
  { value: "REHABILITATION_MEDICINE", label: "재활의학과" },
  { value: "PROSTHODONTICS", label: "치과보철과" },
  { value: "PERIODONTICS", label: "치주과" },
  { value: "INTEGRATED_DENTISTRY", label: "통합치의학과" },
  { value: "PATHOLOGY", label: "병리과" },
  { value: "OCCUPATIONAL_ENVIRONMENTAL_MEDICINE", label: "직업환경의학과" },
  { value: "CONSERVATIVE_DENTISTRY", label: "치과보존과" },
  { value: "OTHER", label: "기타" },
] as const satisfies readonly CheckboxFilterOption[];

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

export function calculateCareerYears(careerStartedAt?: string | null, now = new Date()) {
  if (!careerStartedAt) return null;

  const startedAt = parseLocalDate(careerStartedAt);
  if (!startedAt) return null;

  let years = now.getFullYear() - startedAt.getFullYear();
  const hasNotReachedAnniversary =
    now.getMonth() < startedAt.getMonth() ||
    (now.getMonth() === startedAt.getMonth() && now.getDate() < startedAt.getDate());

  if (hasNotReachedAnniversary) {
    years -= 1;
  }

  return Math.max(years, 0);
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

export function labelDoctorSpecialistField(code?: string | null, label?: string | null) {
  const trimmedLabel = label?.trim();
  if (trimmedLabel) return trimmedLabel;

  const matchedOption = DOCTOR_SPECIALIST_FIELD_OPTIONS.find((option) => option.value === code);
  return matchedOption?.label ?? code ?? "-";
}

export function normalizeDoctor(item: DoctorApiItem): DoctorRow {
  const specialistCode = item.specialist?.code?.trim() || "NONE";
  const categoryNames = (item.categories ?? [])
    .map((category) => category.name?.trim())
    .filter((name): name is string => Boolean(name))
    .filter((name, index, array) => array.indexOf(name) === index);

  return {
    id: item.id,
    hospitalName: item.hospital_name?.trim() || "-",
    name: item.name,
    genderLabel: labelDoctorGender(item.gender),
    position: item.position?.trim() || "-",
    specialistCode,
    specialistLabel: labelDoctorSpecialistField(specialistCode, item.specialist?.label),
    licenseNumber: item.license_number?.trim() || "-",
    categoryNames,
    careerPeriodLabel: formatCareerPeriod(item.career_started_at),
    careerYears: calculateCareerYears(item.career_started_at),
    approvalStatus: item.allow_status || "",
    createdAt: formatDateValue(item.created_at),
    reviewCount: Number(item.review_count ?? 0),
    consultationCount: Number(item.consultation_count ?? 0),
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
  const approvalStatuses = (searchParams.get("allow_status") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const positions = (searchParams.get("position") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const specialistFields = (searchParams.get("specialist_field") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const categoryIds = (searchParams.get("category_ids") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const metricParam = searchParams.get("metric")?.trim() ?? "";
  const allowedMetrics = new Set(DOCTOR_METRIC_OPTIONS.map((option) => option.value));
  const metric = allowedMetrics.has(metricParam as (typeof DOCTOR_METRIC_OPTIONS)[number]["value"]) ? metricParam : "";
  const metricMin = searchParams.get("metric_min")?.trim() ?? "";
  const metricMax = searchParams.get("metric_max")?.trim() ?? "";
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const createdDateState = buildFilterDateState(startDate, endDate);
  const perPage = DOCTORS_PER_PAGE;

  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const allowedSortFields = new Set<SortField>([
    "id",
    "name",
    "gender",
    "position",
    "specialist_field",
    "allow_status",
    "career_years",
    "review_count",
    "consultation_count",
    "created_at",
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
      approvalStatuses,
      positions,
      specialistFields,
      categoryIds,
      metric,
      metricMin,
      metricMax,
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
  if (appliedFilters.approvalStatuses.length > 0) query.allow_status = appliedFilters.approvalStatuses.join(",");
  if (appliedFilters.positions.length > 0) query.position = appliedFilters.positions.join(",");
  if (appliedFilters.specialistFields.length > 0) query.specialist_field = appliedFilters.specialistFields.join(",");
  if (appliedFilters.categoryIds.length > 0) query.category_ids = appliedFilters.categoryIds.join(",");
  if (appliedFilters.metric) {
    query.metric = appliedFilters.metric;
    if (appliedFilters.metricMin.trim()) query.metric_min = Number(appliedFilters.metricMin);
    if (appliedFilters.metricMax.trim()) query.metric_max = Number(appliedFilters.metricMax);
  }
  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;

  return query;
}

export function expandDoctorCategoryIds(value?: string) {
  if (!value) return undefined;

  const categoryIds = value
    .split(",")
    .flatMap((item) => item.split("|"))
    .map((item) => item.trim())
    .filter(Boolean);

  return categoryIds.length > 0 ? categoryIds.join(",") : undefined;
}

export function buildDoctorsQueryString(query: DoctorsQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.allow_status) params.set("allow_status", query.allow_status);
  if (query.position) params.set("position", query.position);
  if (query.specialist_field) params.set("specialist_field", query.specialist_field);
  if (query.category_ids) params.set("category_ids", query.category_ids);
  if (query.metric) params.set("metric", query.metric);
  if (query.metric_min !== undefined) params.set("metric_min", String(query.metric_min));
  if (query.metric_max !== undefined) params.set("metric_max", String(query.metric_max));
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.sort !== DEFAULT_SORT.field) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_SORT.direction) params.set("direction", query.direction);
  if (query.per_page !== DOCTORS_PER_PAGE) params.set("per_page", String(query.per_page));
  if (query.page !== 1) params.set("page", String(query.page));

  return params.toString();
}

export function buildDoctorsReturnToPath(pathname: string, query: DoctorsQuery) {
  const returnQuery = buildDoctorsQueryString(query);
  return returnQuery ? `${pathname}?${returnQuery}` : pathname;
}
