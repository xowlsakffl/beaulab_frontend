import type { BadgeColor, DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

import { resolveMediaAssetUrl, type MediaVariantPreference } from "@/lib/common/media";

export type HospitalEventRealModelDBOption<T extends string = string> = {
  value: T;
  label: string;
};

export type HospitalEventRealModelDBStatus = "RECEIVED" | "APPROVED" | "REJECTED";
export type HospitalEventRealModelDBGender = "MALE" | "FEMALE";
export type HospitalEventRealModelDBSortDirection = "asc" | "desc";
export type HospitalEventRealModelDBSortField =
  | "id"
  | "status"
  | "gender"
  | "birth_date"
  | "created_at"
  | "updated_at";

export type HospitalEventRealModelDBFilters = {
  dateRange: string;
  startDate: string;
  endDate: string;
  birthYearMin: string;
  birthYearMax: string;
  gender: string;
  status: string;
};

export type HospitalEventRealModelDBSortState = {
  field: HospitalEventRealModelDBSortField;
  direction: HospitalEventRealModelDBSortDirection;
  enabled: boolean;
};

export type HospitalEventRealModelDBQuery = {
  q?: string;
  start_date?: string;
  end_date?: string;
  birth_year_min?: string;
  birth_year_max?: string;
  genders?: string;
  statuses?: string;
  sort: HospitalEventRealModelDBSortField;
  direction: HospitalEventRealModelDBSortDirection;
  per_page: number;
  page: number;
};

export type HospitalEventRealModelDBMediaAsset = {
  id: number;
  collection?: string | null;
  disk?: string | null;
  path?: string | null;
  url?: string | null;
  thumbnail_url?: string | null;
  medium_url?: string | null;
  mime_type?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  sort_order?: number | null;
  is_primary?: boolean | null;
  metadata?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
};

export type HospitalEventRealModelDBApiItem = {
  id?: number | null;
  hospital?: {
    id?: number | null;
    name?: string | null;
  } | null;
  event?: {
    id?: number | null;
    name?: string | null;
    normal_price?: number | null;
    event_price?: number | null;
    thumbnail_image?: HospitalEventRealModelDBMediaAsset | null;
  } | null;
  account_user?: {
    id?: number | null;
    name?: string | null;
    nickname?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  name?: string | null;
  gender?: {
    code?: string | null;
    label?: string | null;
  } | null;
  birth_date?: string | null;
  phone?: string | null;
  phone_normalized?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  surgery_period?: {
    code?: string | null;
    label?: string | null;
  } | null;
  support_part?: string | null;
  instagram_url?: string | null;
  blog_url?: string | null;
  special_notes?: Array<{
    code?: string | null;
    label?: string | null;
  }> | null;
  application_reason?: string | null;
  inquiry?: string | null;
  status?: {
    code?: string | null;
    label?: string | null;
  } | null;
  first_image?: HospitalEventRealModelDBMediaAsset | null;
  images?: HospitalEventRealModelDBMediaAsset[] | null;
  image_count?: number | null;
  author_ip?: string | null;
  user_agent?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type HospitalEventRealModelDBRow = {
  id: number;
  createdAt: string;
  hospitalId: number | null;
  hospitalName: string;
  eventId: number | null;
  eventName: string;
  accountUserId: number | null;
  applicantName: string;
  gender: string;
  genderLabel: string;
  birthDate: string;
  phone: string;
  heightCm: number;
  weightKg: number;
  surgeryPeriod: string;
  surgeryPeriodLabel: string;
  supportPart: string;
  status: string;
  statusLabel: string;
  firstImage: HospitalEventRealModelDBMediaAsset | null;
  imageCount: number;
};

export const HOSPITAL_EVENT_REAL_MODEL_DBS_PER_PAGE = 15;

export const DEFAULT_HOSPITAL_EVENT_REAL_MODEL_DB_FILTERS: HospitalEventRealModelDBFilters = {
  dateRange: "",
  startDate: "",
  endDate: "",
  birthYearMin: "",
  birthYearMax: "",
  gender: "",
  status: "",
};

export const DEFAULT_HOSPITAL_EVENT_REAL_MODEL_DB_SORT: HospitalEventRealModelDBSortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

export const HOSPITAL_EVENT_REAL_MODEL_DB_DATE_PRESET_OPTIONS = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "recent7", label: "최근 7일" },
  { key: "recent30", label: "최근 30일" },
] as const satisfies readonly DatePresetOption[];

export type HospitalEventRealModelDBDatePresetKey =
  (typeof HOSPITAL_EVENT_REAL_MODEL_DB_DATE_PRESET_OPTIONS)[number]["key"];

export const HOSPITAL_EVENT_REAL_MODEL_DB_GENDER_OPTIONS: HospitalEventRealModelDBOption[] = [
  { value: "", label: "전체" },
  { value: "MALE", label: "남" },
  { value: "FEMALE", label: "여" },
];

export const HOSPITAL_EVENT_REAL_MODEL_DB_STATUS_OPTIONS: HospitalEventRealModelDBOption[] = [
  { value: "", label: "전체" },
  { value: "RECEIVED", label: "접수" },
  { value: "APPROVED", label: "승인" },
  { value: "REJECTED", label: "미승인" },
];

const HOSPITAL_EVENT_REAL_MODEL_DB_SORT_FIELDS = new Set<HospitalEventRealModelDBSortField>([
  "id",
  "status",
  "gender",
  "birth_date",
  "created_at",
  "updated_at",
]);
const GENDER_VALUES = new Set(HOSPITAL_EVENT_REAL_MODEL_DB_GENDER_OPTIONS.map((option) => option.value));
const STATUS_VALUES = new Set(HOSPITAL_EVENT_REAL_MODEL_DB_STATUS_OPTIONS.map((option) => option.value));

export function labelHospitalEventRealModelDBStatus(status?: string | null) {
  switch (status) {
    case "RECEIVED":
      return "접수";
    case "APPROVED":
      return "승인";
    case "REJECTED":
      return "미승인";
    default:
      return "-";
  }
}

export function hospitalEventRealModelDBStatusColor(status?: string | null): BadgeColor {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "error";

  return "info";
}

export function formatHospitalEventRealModelDBDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${formatLocalDate(date)} ${hours}:${minutes}`;
}

export function resolveHospitalEventRealModelDBMediaUrl(
  media?: HospitalEventRealModelDBMediaAsset | null,
  preferredVariant: MediaVariantPreference = "original",
) {
  return resolveMediaAssetUrl(media, preferredVariant);
}

export function normalizeHospitalEventRealModelDB(
  item: HospitalEventRealModelDBApiItem,
): HospitalEventRealModelDBRow {
  const status = item.status?.code?.trim() || "RECEIVED";
  const gender = item.gender?.code?.trim() || "";
  const surgeryPeriod = item.surgery_period?.code?.trim() || "";

  return {
    id: Number(item.id ?? 0),
    createdAt: formatHospitalEventRealModelDBDateTime(item.created_at),
    hospitalId: normalizeNullableId(item.hospital?.id),
    hospitalName: item.hospital?.name?.trim() || "-",
    eventId: normalizeNullableId(item.event?.id),
    eventName: item.event?.name?.trim() || "-",
    accountUserId: normalizeNullableId(item.account_user?.id),
    applicantName: item.name?.trim() || "-",
    gender,
    genderLabel: item.gender?.label?.trim() || labelGender(gender),
    birthDate: formatDateString(item.birth_date),
    phone: item.phone?.trim() || item.phone_normalized?.trim() || "-",
    heightCm: Number(item.height_cm ?? 0),
    weightKg: Number(item.weight_kg ?? 0),
    surgeryPeriod,
    surgeryPeriodLabel: item.surgery_period?.label?.trim() || "-",
    supportPart: item.support_part?.trim() || "-",
    status,
    statusLabel: item.status?.label?.trim() || labelHospitalEventRealModelDBStatus(status),
    firstImage: item.first_image ?? null,
    imageCount: Number(item.image_count ?? 0),
  };
}

export function parseHospitalEventRealModelDBsTableState(searchParams: URLSearchParams) {
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const birthYearMin = normalizeYearParam(searchParams.get("birth_year_min"));
  const birthYearMax = normalizeYearParam(searchParams.get("birth_year_max"));
  const dateState = buildHospitalEventRealModelDBDateState(startDate, endDate);
  const sortFieldParam = searchParams.get("sort");
  const sortDirectionParam = searchParams.get("direction");
  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const sortField = sortFieldParam && HOSPITAL_EVENT_REAL_MODEL_DB_SORT_FIELDS.has(sortFieldParam as HospitalEventRealModelDBSortField)
    ? (sortFieldParam as HospitalEventRealModelDBSortField)
    : DEFAULT_HOSPITAL_EVENT_REAL_MODEL_DB_SORT.field;

  return {
    searchKeyword: searchParams.get("q")?.trim() ?? "",
    filters: {
      ...DEFAULT_HOSPITAL_EVENT_REAL_MODEL_DB_FILTERS,
      dateRange: dateState.label,
      startDate,
      endDate,
      birthYearMin,
      birthYearMax,
      gender: normalizeOptionValue(searchParams.get("genders"), GENDER_VALUES),
      status: normalizeOptionValue(searchParams.get("statuses"), STATUS_VALUES),
    },
    draftDateRange: dateState.range,
    sortState: {
      field: sortField,
      direction: sortDirectionParam === "asc" ? "asc" : "desc",
      enabled: Boolean(sortFieldParam || sortDirectionParam),
    } satisfies HospitalEventRealModelDBSortState,
    page,
  };
}

export function buildHospitalEventRealModelDBsQuery({
  searchKeyword,
  appliedFilters,
  sortState,
  page,
}: {
  searchKeyword: string;
  appliedFilters: HospitalEventRealModelDBFilters;
  sortState: HospitalEventRealModelDBSortState;
  page: number;
}): HospitalEventRealModelDBQuery {
  const query: HospitalEventRealModelDBQuery = {
    sort: sortState.enabled ? sortState.field : DEFAULT_HOSPITAL_EVENT_REAL_MODEL_DB_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_HOSPITAL_EVENT_REAL_MODEL_DB_SORT.direction,
    per_page: HOSPITAL_EVENT_REAL_MODEL_DBS_PER_PAGE,
    page,
  };

  const q = searchKeyword.trim();

  if (q) query.q = q;
  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;
  if (appliedFilters.birthYearMin) query.birth_year_min = appliedFilters.birthYearMin;
  if (appliedFilters.birthYearMax) query.birth_year_max = appliedFilters.birthYearMax;
  if (appliedFilters.gender) query.genders = appliedFilters.gender;
  if (appliedFilters.status) query.statuses = appliedFilters.status;

  return query;
}

export function buildHospitalEventRealModelDBsQueryString(query: HospitalEventRealModelDBQuery) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (key === "sort" && value === DEFAULT_HOSPITAL_EVENT_REAL_MODEL_DB_SORT.field) return;
    if (key === "direction" && value === DEFAULT_HOSPITAL_EVENT_REAL_MODEL_DB_SORT.direction) return;
    if (key === "per_page" && value === HOSPITAL_EVENT_REAL_MODEL_DBS_PER_PAGE) return;
    if (key === "page" && value === 1) return;

    params.set(key, String(value));
  });

  return params.toString();
}

export function nextHospitalEventRealModelDBSortState(
  prev: HospitalEventRealModelDBSortState,
  field: HospitalEventRealModelDBSortField,
): HospitalEventRealModelDBSortState {
  if (prev.field !== field) return { field, direction: "desc", enabled: true };
  if (prev.direction === "desc") return { field, direction: "asc", enabled: true };

  return { ...DEFAULT_HOSPITAL_EVENT_REAL_MODEL_DB_SORT, enabled: false };
}

export function mapDateRangeToHospitalEventRealModelDBFilter(range?: DateRange) {
  return {
    label: formatDateRange(range),
    startDate: range?.from ? formatLocalDate(range.from) : "",
    endDate: range?.to ? formatLocalDate(range.to) : "",
  };
}

export function buildHospitalEventRealModelDBPresetDateRange(
  preset: HospitalEventRealModelDBDatePresetKey,
): DateRange {
  const today = normalizeRangeDate(new Date());

  if (preset === "today") return { from: today, to: today };

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

export function normalizeRangeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildHospitalEventRealModelDBDateState(startDate: string, endDate: string) {
  const from = startDate ? parseDateParam(startDate) : undefined;
  const to = endDate ? parseDateParam(endDate) : undefined;
  const range = from || to ? { from: from ?? to, to: to ?? from } : undefined;

  return {
    range,
    label: formatDateRange(range),
  };
}

function formatDateRange(range?: DateRange) {
  if (!range?.from) return "";

  const fromDate = formatFilterDisplayDate(range.from);
  if (!range.to) return fromDate;

  return `${fromDate} ~ ${formatFilterDisplayDate(range.to)}`;
}

function formatDateString(value?: string | null) {
  if (!value) return "-";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;

  return `${match[1]}-${match[2]}-${match[3]}`;
}

function parseDateParam(value: string) {
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

function formatLocalDate(date: Date) {
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

function normalizeOptionValue(value: string | null | undefined, availableValues: Set<string>) {
  const firstValue = (value ?? "").split(",")[0]?.trim() ?? "";

  return availableValues.has(firstValue) ? firstValue : "";
}

function normalizeYearParam(value: string | null | undefined) {
  const normalized = (value ?? "").trim();

  return /^\d{4}$/.test(normalized) ? normalized : "";
}

function normalizeNullableId(value: number | null | undefined) {
  const id = Number(value ?? 0);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function labelGender(value?: string | null) {
  return HOSPITAL_EVENT_REAL_MODEL_DB_GENDER_OPTIONS.find((option) => option.value === value)?.label || "-";
}
