import type { DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

import { CATEGORY_USAGES } from "@/lib/common/category";
import { resolveMediaAssetUrl, type MediaVariantPreference } from "@/lib/common/media";

export type HospitalEventCategory = {
  id?: number | null;
  code?: string | null;
  domain?: string | null;
  name?: string | null;
  full_path?: string | null;
  depth?: number | null;
  is_primary?: boolean | null;
};

export type HospitalEventMedia = {
  id?: number | null;
  path?: string | null;
  url?: string | null;
  mime_type?: string | null;
  width?: number | null;
  height?: number | null;
  metadata?: unknown;
};

export type HospitalEventApiItem = {
  id: number;
  hospital?: {
    id?: number | null;
    name?: string | null;
    manager?: {
      id?: number | null;
      name?: string | null;
      nickname?: string | null;
      email?: string | null;
    } | null;
  } | null;
  categories?: HospitalEventCategory[] | null;
  thumbnail_image?: HospitalEventMedia | null;
  event_type?: string | null;
  name?: string | null;
  description?: string | null;
  is_event_period_unlimited?: boolean | null;
  event_start_at?: string | null;
  event_end_at?: string | null;
  normal_price?: number | null;
  event_price?: number | null;
  discount_rate?: number | null;
  consultation_price?: number | null;
  consultation_count?: number | null;
  confirmed_consultation_count?: number | null;
  total_spent_point?: number | null;
  status?: string | null;
  allow_status?: string | null;
  view_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type HospitalEventRow = {
  id: number;
  hospitalName: string;
  categoryLabel: string;
  name: string;
  thumbnailUrl: string | null;
  periodLabel: string;
  eventStartAt: string;
  eventEndAt: string;
  isEventPeriodUnlimited: boolean;
  eventPrice: number;
  discountRate: number;
  consultationCount: number;
  confirmedConsultationCount: number;
  totalSpentPoint: number;
  status: string;
  allowStatus: string;
  viewCount: number;
  managerName: string;
  createdAt: string;
  updatedAt: string;
};

export type HospitalEventSummary = {
  active_events?: number | null;
  recent_created_events?: number | null;
  ending_soon_events?: number | null;
  recent_stopped_events?: number | null;
  pending_events?: number | null;
  reviewing_events?: number | null;
  rejected_events?: number | null;
  partner_canceled_events?: number | null;
};

export type HospitalEventDateType = "event_start_at" | "event_end_at";
export type HospitalEventQuantityMetric = "all" | "consultation_count" | "view_count";
export type HospitalEventAmountMetric = "all" | "event_price" | "consultation_price" | "total_spent_point";
export type HospitalEventSortField =
  | "id"
  | "event_price"
  | "discount_rate"
  | "view_count"
  | "status"
  | "allow_status"
  | "created_at"
  | "updated_at"
  | "event_start_at"
  | "event_end_at";
export type HospitalEventSortDirection = "asc" | "desc";

export type HospitalEventSortState = {
  field: HospitalEventSortField;
  direction: HospitalEventSortDirection;
  enabled: boolean;
};

export type HospitalEventFilters = {
  dateTypes: HospitalEventDateType[];
  dateRange: string;
  startDate: string;
  endDate: string;
  visibilityStatus: string;
  majorCategoryId: string;
  middleCategoryId: string;
  quantityMetric: HospitalEventQuantityMetric;
  quantityMin: string;
  quantityMax: string;
  allowStatuses: string[];
  amountMetric: HospitalEventAmountMetric;
  amountMin: string;
  amountMax: string;
};

export type HospitalEventsQuery = {
  q?: string;
  date_types?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  category_ids?: string;
  quantity_metric?: HospitalEventQuantityMetric;
  quantity_min?: string;
  quantity_max?: string;
  allow_status?: string;
  amount_metric?: HospitalEventAmountMetric;
  amount_min?: string;
  amount_max?: string;
  sort: HospitalEventSortField;
  direction: HospitalEventSortDirection;
  per_page: number;
  page: number;
};

export const HOSPITAL_EVENTS_PER_PAGE = 15;

export const DEFAULT_HOSPITAL_EVENT_SORT: HospitalEventSortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

export const DEFAULT_HOSPITAL_EVENT_FILTERS: HospitalEventFilters = {
  dateTypes: ["event_start_at"],
  dateRange: "",
  startDate: "",
  endDate: "",
  visibilityStatus: "",
  majorCategoryId: "",
  middleCategoryId: "",
  quantityMetric: "all",
  quantityMin: "",
  quantityMax: "",
  allowStatuses: [],
  amountMetric: "all",
  amountMin: "",
  amountMax: "",
};

export const HOSPITAL_EVENT_CATEGORY_USAGES = [
  CATEGORY_USAGES.HOSPITAL_EVENT_SURGERY,
  CATEGORY_USAGES.HOSPITAL_EVENT_TREATMENT,
] as const;

export const HOSPITAL_EVENT_VISIBILITY_OPTIONS = [
  { value: "", label: "전체" },
  { value: "ACTIVE", label: "노출" },
  { value: "INACTIVE", label: "미노출" },
];

export const HOSPITAL_EVENT_ALLOW_STATUS_OPTIONS = [
  { value: "PENDING", label: "검수신청중" },
  { value: "REVIEWING", label: "검토중" },
  { value: "REJECTED", label: "검수반려" },
  { value: "PARTNER_CANCELED", label: "파트너취소" },
  { value: "APPROVED", label: "검수완료" },
];

export const HOSPITAL_EVENT_QUANTITY_METRIC_OPTIONS: { value: HospitalEventQuantityMetric; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "consultation_count", label: "상담신청수" },
  { value: "view_count", label: "조회수" },
];

export const HOSPITAL_EVENT_AMOUNT_METRIC_OPTIONS: { value: HospitalEventAmountMetric; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "event_price", label: "이벤트가격" },
  { value: "consultation_price", label: "소진단가 P" },
  { value: "total_spent_point", label: "총 소진금액 P" },
];

export const HOSPITAL_EVENT_DATE_TYPE_OPTIONS: { value: HospitalEventDateType; label: string }[] = [
  { value: "event_start_at", label: "시작일" },
  { value: "event_end_at", label: "종료일" },
];

export const HOSPITAL_EVENT_DATE_PRESET_OPTIONS = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "recent7", label: "최근 7일" },
  { key: "recent30", label: "최근 30일" },
] as const satisfies readonly DatePresetOption[];

export type HospitalEventDatePresetKey = (typeof HOSPITAL_EVENT_DATE_PRESET_OPTIONS)[number]["key"];

const HOSPITAL_EVENT_SORT_FIELDS = new Set<HospitalEventSortField>([
  "id",
  "event_price",
  "discount_rate",
  "view_count",
  "status",
  "allow_status",
  "created_at",
  "updated_at",
  "event_start_at",
  "event_end_at",
]);
const HOSPITAL_EVENT_VISIBILITY_VALUE_SET = new Set(HOSPITAL_EVENT_VISIBILITY_OPTIONS.map((option) => option.value));
const HOSPITAL_EVENT_ALLOW_STATUS_VALUE_SET = new Set(HOSPITAL_EVENT_ALLOW_STATUS_OPTIONS.map((option) => option.value));
const HOSPITAL_EVENT_QUANTITY_METRIC_VALUE_SET = new Set(HOSPITAL_EVENT_QUANTITY_METRIC_OPTIONS.map((option) => option.value));
const HOSPITAL_EVENT_AMOUNT_METRIC_VALUE_SET = new Set(HOSPITAL_EVENT_AMOUNT_METRIC_OPTIONS.map((option) => option.value));
const HOSPITAL_EVENT_DATE_TYPE_VALUE_SET = new Set(HOSPITAL_EVENT_DATE_TYPE_OPTIONS.map((option) => option.value));
export function resolveHospitalEventMediaUrl(
  media?: HospitalEventMedia | null,
  preferredVariant: MediaVariantPreference = "original",
): string | null {
  return resolveMediaAssetUrl(media, preferredVariant);
}

export function labelHospitalEventVisibilityStatus(status?: string | null) {
  return status === "INACTIVE" ? "미노출" : "노출";
}

export function labelHospitalEventAllowStatus(status?: string | null) {
  switch (status) {
    case "PENDING":
      return "검수신청중";
    case "REVIEWING":
      return "검토중";
    case "REJECTED":
      return "검수반려";
    case "PARTNER_CANCELED":
      return "파트너취소";
    case "APPROVED":
      return "검수완료";
    default:
      return "-";
  }
}

export function formatHospitalEventDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return formatLocalDate(date);
}

export function formatHospitalEventDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${formatLocalDate(date)} ${hours}:${minutes}`;
}

export function formatHospitalEventPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

export function formatHospitalEventPoint(value: number) {
  return `${value.toLocaleString()} P`;
}

export function formatHospitalEventCategory(category?: HospitalEventCategory | null, maxDepth = 2) {
  const rawPath = category?.full_path?.trim() || category?.name?.trim() || "";
  const path = rawPath
    .split(">")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxDepth)
    .join(" > ");

  return path;
}

export function formatHospitalEventCategories(categories?: HospitalEventCategory[] | null) {
  const values = Array.from(new Set(
    (categories ?? [])
      .map((category) => formatHospitalEventCategory(category, 2))
      .filter(Boolean),
  ));

  return values.length > 0 ? values.join("\n") : "-";
}

export function normalizeHospitalEvent(item: HospitalEventApiItem): HospitalEventRow {
  const status = item.status?.trim() || "INACTIVE";
  const allowStatus = item.allow_status?.trim() || "";

  return {
    id: item.id,
    hospitalName: item.hospital?.name?.trim() || "-",
    categoryLabel: formatHospitalEventCategories(item.categories),
    name: item.name?.trim() || "-",
    thumbnailUrl: resolveHospitalEventMediaUrl(item.thumbnail_image, "thumb"),
    periodLabel: formatHospitalEventPeriod(item),
    eventStartAt: formatHospitalEventDateInput(item.event_start_at),
    eventEndAt: formatHospitalEventDateInput(item.event_end_at),
    isEventPeriodUnlimited: Boolean(item.is_event_period_unlimited),
    eventPrice: Number(item.event_price ?? 0),
    discountRate: Number(item.discount_rate ?? 0),
    consultationCount: Number(item.consultation_count ?? 0),
    confirmedConsultationCount: Number(item.confirmed_consultation_count ?? 0),
    totalSpentPoint: Number(item.total_spent_point ?? 0),
    status,
    allowStatus,
    viewCount: Number(item.view_count ?? 0),
    managerName: item.hospital?.manager?.name?.trim() || item.hospital?.manager?.nickname?.trim() || "-",
    createdAt: formatHospitalEventDateTime(item.created_at),
    updatedAt: formatHospitalEventDateTime(item.updated_at),
  };
}

export function formatHospitalEventPeriod(item: HospitalEventApiItem) {
  const start = formatHospitalEventShortDate(item.event_start_at);
  if (item.is_event_period_unlimited) return `${start} ~ 무기한`;

  return `${start} ~ ${formatHospitalEventShortDate(item.event_end_at)}`;
}

function formatHospitalEventDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function formatHospitalEventShortDate(value?: string | null) {
  const formatted = formatHospitalEventDate(value);

  return formatted.length === 10 ? formatted.slice(2) : formatted;
}

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

export function buildHospitalEventPresetDateRange(preset: HospitalEventDatePresetKey): DateRange {
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

export function mapDateRangeToHospitalEventFilter(range?: DateRange) {
  return {
    label: formatDateRange(range),
    startDate: range?.from ? formatLocalDate(range.from) : "",
    endDate: range?.to ? formatLocalDate(range.to) : "",
  };
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

export function buildHospitalEventDateState(startDate: string, endDate: string) {
  const from = startDate ? parseDateParam(startDate) : undefined;
  const to = endDate ? parseDateParam(endDate) : undefined;
  const range = from || to ? { from: from ?? to, to: to ?? from } : undefined;

  return {
    range,
    label: formatDateRange(range),
  };
}

export function normalizeNumberBound(value: string | null | undefined) {
  const trimmedValue = (value ?? "").trim();
  if (!/^\d+$/.test(trimmedValue)) return "";

  return trimmedValue.replace(/^0+(?=\d)/, "");
}

export function nextHospitalEventSortState(
  prev: HospitalEventSortState,
  field: HospitalEventSortField,
): HospitalEventSortState {
  if (prev.field !== field) return { field, direction: "desc", enabled: true };
  if (prev.enabled && prev.direction === "desc") return { field, direction: "asc", enabled: true };
  if (prev.enabled && prev.direction === "asc") return { ...DEFAULT_HOSPITAL_EVENT_SORT, enabled: false };

  return { field, direction: "desc", enabled: true };
}

export function parseHospitalEventsTableState(searchParams: URLSearchParams) {
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const dateState = buildHospitalEventDateState(startDate, endDate);
  const dateTypes = normalizeListParam(searchParams.get("date_types"))
    .filter((value): value is HospitalEventDateType => HOSPITAL_EVENT_DATE_TYPE_VALUE_SET.has(value as HospitalEventDateType));
  const visibilityStatus = searchParams.get("status") ?? "";
  const allowStatuses = normalizeListParam(searchParams.get("allow_status"))
    .filter((value) => HOSPITAL_EVENT_ALLOW_STATUS_VALUE_SET.has(value));
  const quantityMetricParam = searchParams.get("quantity_metric");
  const amountMetricParam = searchParams.get("amount_metric");
  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const sortFieldParam = searchParams.get("sort");
  const sortDirectionParam = searchParams.get("direction");
  const sortField = sortFieldParam && HOSPITAL_EVENT_SORT_FIELDS.has(sortFieldParam as HospitalEventSortField)
    ? (sortFieldParam as HospitalEventSortField)
    : DEFAULT_HOSPITAL_EVENT_SORT.field;
  const sortDirection: HospitalEventSortDirection = sortDirectionParam === "asc" ? "asc" : "desc";

  return {
    searchKeyword: searchParams.get("q")?.trim() ?? "",
    filters: {
      ...DEFAULT_HOSPITAL_EVENT_FILTERS,
      dateTypes: dateTypes.length > 0 ? [dateTypes[0]] : DEFAULT_HOSPITAL_EVENT_FILTERS.dateTypes,
      dateRange: dateState.label,
      startDate,
      endDate,
      visibilityStatus: HOSPITAL_EVENT_VISIBILITY_VALUE_SET.has(visibilityStatus) ? visibilityStatus : "",
      majorCategoryId: normalizePositiveId(searchParams.get("major_category_id")),
      middleCategoryId: normalizePositiveId(searchParams.get("middle_category_id") ?? searchParams.get("category_ids")),
      quantityMetric: quantityMetricParam && HOSPITAL_EVENT_QUANTITY_METRIC_VALUE_SET.has(quantityMetricParam as HospitalEventQuantityMetric)
        ? (quantityMetricParam as HospitalEventQuantityMetric)
        : "all",
      quantityMin: normalizeNumberBound(searchParams.get("quantity_min")),
      quantityMax: normalizeNumberBound(searchParams.get("quantity_max")),
      allowStatuses,
      amountMetric: amountMetricParam && HOSPITAL_EVENT_AMOUNT_METRIC_VALUE_SET.has(amountMetricParam as HospitalEventAmountMetric)
        ? (amountMetricParam as HospitalEventAmountMetric)
        : "all",
      amountMin: normalizeNumberBound(searchParams.get("amount_min")),
      amountMax: normalizeNumberBound(searchParams.get("amount_max")),
    },
    draftDateRange: dateState.range,
    sortState: {
      field: sortField,
      direction: sortDirection,
      enabled: Boolean(sortFieldParam || sortDirectionParam),
    },
    page,
  };
}

export function buildHospitalEventsQuery({
  searchKeyword,
  appliedFilters,
  sortState,
  page,
}: {
  searchKeyword: string;
  appliedFilters: HospitalEventFilters;
  sortState: HospitalEventSortState;
  page: number;
}): HospitalEventsQuery {
  const query: HospitalEventsQuery = {
    sort: sortState.enabled ? sortState.field : DEFAULT_HOSPITAL_EVENT_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_HOSPITAL_EVENT_SORT.direction,
    per_page: HOSPITAL_EVENTS_PER_PAGE,
    page,
  };

  const trimmedSearch = searchKeyword.trim();
  if (trimmedSearch) query.q = trimmedSearch;
  if (appliedFilters.dateTypes.length > 0) query.date_types = appliedFilters.dateTypes.join(",");
  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;
  if (appliedFilters.visibilityStatus) query.status = appliedFilters.visibilityStatus;

  const categoryId = appliedFilters.middleCategoryId || appliedFilters.majorCategoryId;
  if (/^[1-9]\d*$/.test(categoryId)) query.category_ids = categoryId;

  const quantityMin = normalizeNumberBound(appliedFilters.quantityMin);
  const quantityMax = normalizeNumberBound(appliedFilters.quantityMax);
  if ((quantityMin || quantityMax) && appliedFilters.quantityMetric !== "consultation_count") {
    query.quantity_metric = appliedFilters.quantityMetric;
    if (quantityMin) query.quantity_min = quantityMin;
    if (quantityMax) query.quantity_max = quantityMax;
  }

  if (appliedFilters.allowStatuses.length > 0) query.allow_status = appliedFilters.allowStatuses.join(",");

  const amountMin = normalizeNumberBound(appliedFilters.amountMin);
  const amountMax = normalizeNumberBound(appliedFilters.amountMax);
  if ((amountMin || amountMax) && appliedFilters.amountMetric !== "total_spent_point") {
    query.amount_metric = appliedFilters.amountMetric;
    if (amountMin) query.amount_min = amountMin;
    if (amountMax) query.amount_max = amountMax;
  }

  return query;
}

export function buildHospitalEventsQueryString(query: HospitalEventsQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.date_types) params.set("date_types", query.date_types);
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.status) params.set("status", query.status);
  if (query.category_ids) params.set("category_ids", query.category_ids);
  if (query.quantity_metric) params.set("quantity_metric", query.quantity_metric);
  if (query.quantity_min) params.set("quantity_min", query.quantity_min);
  if (query.quantity_max) params.set("quantity_max", query.quantity_max);
  if (query.allow_status) params.set("allow_status", query.allow_status);
  if (query.amount_metric) params.set("amount_metric", query.amount_metric);
  if (query.amount_min) params.set("amount_min", query.amount_min);
  if (query.amount_max) params.set("amount_max", query.amount_max);
  if (query.sort !== DEFAULT_HOSPITAL_EVENT_SORT.field || !DEFAULT_HOSPITAL_EVENT_SORT.enabled) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_HOSPITAL_EVENT_SORT.direction) params.set("direction", query.direction);
  if (query.page > 1) params.set("page", String(query.page));

  return params.toString();
}

export function buildHospitalEventsReturnToPath(pathname: string, query: HospitalEventsQuery) {
  const queryString = buildHospitalEventsQueryString(query);

  return queryString ? `${pathname}?${queryString}` : pathname;
}

function normalizeListParam(value: string | null | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizePositiveId(value: string | null | undefined) {
  const trimmedValue = (value ?? "").trim();

  return /^[1-9]\d*$/.test(trimmedValue) ? trimmedValue : "";
}
