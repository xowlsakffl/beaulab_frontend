import type { BadgeColor, CheckboxFilterOption, DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

import {
  labelReviewAllowStatus,
  REVIEW_ALLOW_STATUS_OPTIONS,
  reviewAllowStatusColor,
} from "@/lib/common/review-status";

type EventAdHospitalRef = {
  id?: number | null;
  name?: string | null;
};

type EventAdHospitalEventRef = {
  id?: number | null;
  name?: string | null;
  allow_status?: string | null;
  hospital_status?: string | null;
  admin_status?: string | null;
};

type EventAdManagerStaffRef = {
  id?: number | null;
  name?: string | null;
  email?: string | null;
};

type EventAdCategoryRef = {
  id?: number | null;
  code?: string | null;
  name?: string | null;
  full_path?: string | null;
  depth?: number | null;
  is_primary?: boolean | null;
};

export type EventAdApiItem = {
  id: number;
  hospital?: EventAdHospitalRef | null;
  hospital_event?: EventAdHospitalEventRef | null;
  category?: EventAdCategoryRef | null;
  categories?: EventAdCategoryRef[] | null;
  manager_staff?: EventAdManagerStaffRef | null;
  placement?: string | null;
  placement_label?: string | null;
  placement_group_label?: string | null;
  cost?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  allow_status?: string | null;
  allow_status_label?: string | null;
  ad_status?: string | null;
  ad_status_label?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type EventAdRow = {
  id: number;
  requestedAt: string;
  placement: string;
  placementLabel: string;
  placementGroupLabel: string;
  cost: number;
  costLabel: string;
  periodLabel: string;
  hospitalId: number | null;
  hospitalName: string;
  eventId: number | null;
  eventName: string;
  categoryLabel: string;
  allowStatus: string;
  allowStatusLabel: string;
  adStatus: string;
  adStatusLabel: string;
  managerName: string;
};

export type EventAdDateType = "created_at" | "ad_period";
export type EventAdSortField =
  "id" | "placement" | "cost" | "start_at" | "end_at" | "allow_status" | "created_at" | "updated_at";
export type EventAdSortDirection = "asc" | "desc";

export type EventAdSortState = {
  field: EventAdSortField;
  direction: EventAdSortDirection;
  enabled: boolean;
};

export type EventAdFilters = {
  dateTypes: EventAdDateType[];
  dateRange: string;
  startDate: string;
  endDate: string;
  placements: string[];
  allowStatuses: string[];
  adStatuses: string[];
};

export type EventAdsQuery = {
  q?: string;
  date_types?: string;
  start_date?: string;
  end_date?: string;
  placement?: string;
  allow_status?: string;
  ad_status?: string;
  sort: EventAdSortField;
  direction: EventAdSortDirection;
  per_page: number;
  page: number;
};

export const EVENT_ADS_PER_PAGE = 15;

export const DEFAULT_EVENT_AD_SORT: EventAdSortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

export const DEFAULT_EVENT_AD_FILTERS: EventAdFilters = {
  dateTypes: ["created_at"],
  dateRange: "",
  startDate: "",
  endDate: "",
  placements: [],
  allowStatuses: [],
  adStatuses: [],
};

export const EVENT_AD_PLACEMENT_OPTIONS: CheckboxFilterOption[] = [
  { value: "MAIN_POPUP", label: "메인 팝업" },
  { value: "MAIN_VERTICAL_BANNER", label: "메인 세로배너" },
  { value: "MAIN_HORIZONTAL_BANNER", label: "메인 가로배너" },
  { value: "SURGERY_TOP_BANNER", label: "성형 상단배너" },
  { value: "SURGERY_HOT_EVENT", label: "성형 HOT이벤트" },
  { value: "SURGERY_CATEGORY_BANNER", label: "성형 카테고리별 배너" },
  { value: "PETIT_TOP_BANNER", label: "쁘띠 상단배너" },
  { value: "PETIT_HOT_EVENT", label: "쁘띠 HOT이벤트" },
  { value: "PETIT_CATEGORY_BANNER", label: "쁘띠 카테고리별 배너" },
  { value: "CONSULT_MEMO", label: "상담메모장" },
  { value: "SEARCH", label: "검색창" },
];

export const EVENT_AD_ALLOW_STATUS_OPTIONS: CheckboxFilterOption[] = REVIEW_ALLOW_STATUS_OPTIONS.map((option) => ({
  ...option,
}));

export const EVENT_AD_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "SCHEDULED", label: "광고예정" },
  { value: "RUNNING", label: "광고중" },
  { value: "ENDED", label: "광고종료" },
];

export const EVENT_AD_DATE_TYPE_OPTIONS: { value: EventAdDateType; label: string }[] = [
  { value: "created_at", label: "신청일" },
  { value: "ad_period", label: "광고기간" },
];

export const EVENT_AD_DATE_PRESET_OPTIONS = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "recent7", label: "최근 7일" },
  { key: "recent30", label: "최근 30일" },
] as const satisfies readonly DatePresetOption[];

export type EventAdDatePresetKey = (typeof EVENT_AD_DATE_PRESET_OPTIONS)[number]["key"];

const EVENT_AD_SORT_FIELDS = new Set<EventAdSortField>([
  "id",
  "placement",
  "cost",
  "start_at",
  "end_at",
  "allow_status",
  "created_at",
  "updated_at",
]);
const EVENT_AD_DATE_TYPE_VALUE_SET = new Set(EVENT_AD_DATE_TYPE_OPTIONS.map((option) => option.value));
const EVENT_AD_PLACEMENT_VALUE_SET = new Set(EVENT_AD_PLACEMENT_OPTIONS.map((option) => option.value));
const EVENT_AD_ALLOW_STATUS_VALUE_SET = new Set(EVENT_AD_ALLOW_STATUS_OPTIONS.map((option) => option.value));
const EVENT_AD_STATUS_VALUE_SET = new Set(EVENT_AD_STATUS_OPTIONS.map((option) => option.value));

export function formatEventAdLocalDate(date: Date) {
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

export function formatEventAdDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${formatEventAdLocalDate(date)} ${hours}:${minutes}`;
}

function formatEventAdShortDateTime(value?: string | null) {
  const formatted = formatEventAdDateTime(value);

  return formatted.length === 16 ? formatted.slice(2) : formatted;
}

export function formatEventAdDateRange(range?: DateRange) {
  if (!range?.from) return "";

  const fromDate = formatFilterDisplayDate(range.from);
  if (!range.to) return fromDate;

  return `${fromDate} ~ ${formatFilterDisplayDate(range.to)}`;
}

export function normalizeEventAdRangeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function buildEventAdPresetDateRange(preset: EventAdDatePresetKey): DateRange {
  const today = normalizeEventAdRangeDate(new Date());

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

export function mapDateRangeToEventAdFilter(range?: DateRange) {
  return {
    label: formatEventAdDateRange(range),
    startDate: range?.from ? formatEventAdLocalDate(range.from) : "",
    endDate: range?.to ? formatEventAdLocalDate(range.to) : "",
  };
}

export function parseEventAdDateParam(value: string) {
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

export function buildEventAdDateState(startDate: string, endDate: string) {
  const from = startDate ? parseEventAdDateParam(startDate) : undefined;
  const to = endDate ? parseEventAdDateParam(endDate) : undefined;
  const range = from || to ? { from: from ?? to, to: to ?? from } : undefined;

  return {
    range,
    label: formatEventAdDateRange(range),
  };
}

export function formatEventAdCost(value: number) {
  return `${value.toLocaleString()}원`;
}

export function labelEventAdPlacement(placement?: string | null) {
  return EVENT_AD_PLACEMENT_OPTIONS.find((option) => option.value === placement)?.label ?? placement?.trim() ?? "-";
}

export function labelEventAdAllowStatus(status?: string | null) {
  return labelReviewAllowStatus(status);
}

export function eventAdAllowStatusColor(status?: string | null): BadgeColor {
  return reviewAllowStatusColor(status);
}

export function labelEventAdStatus(status?: string | null) {
  return EVENT_AD_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status?.trim() ?? "-";
}

export function eventAdStatusColor(status?: string | null): BadgeColor {
  if (status === "RUNNING") return "success";
  if (status === "SCHEDULED") return "warning";
  if (status === "ENDED") return "gray";

  return "light";
}

function formatEventAdCategory(category?: EventAdCategoryRef | null) {
  const rawPath = category?.full_path?.trim() || category?.name?.trim() || "";

  return rawPath || "-";
}

function formatEventAdPeriod(startAt?: string | null, endAt?: string | null) {
  const start = formatEventAdShortDateTime(startAt);
  const end = formatEventAdShortDateTime(endAt);

  if (start === "-" && end === "-") return "-";

  return `${start}\n~ ${end}`;
}

export function normalizeEventAd(item: EventAdApiItem): EventAdRow {
  const placement = item.placement?.trim() || "";
  const allowStatus = item.allow_status?.trim() || "";
  const adStatus = item.ad_status?.trim() || "";
  const cost = Number(item.cost ?? 0);
  const category = item.category ?? item.categories?.[0] ?? null;

  return {
    id: item.id,
    requestedAt: formatEventAdDateTime(item.created_at),
    placement,
    placementLabel: item.placement_label?.trim() || labelEventAdPlacement(placement),
    placementGroupLabel: item.placement_group_label?.trim() || "-",
    cost,
    costLabel: formatEventAdCost(cost),
    periodLabel: formatEventAdPeriod(item.start_at, item.end_at),
    hospitalId: item.hospital?.id ? Number(item.hospital.id) : null,
    hospitalName: item.hospital?.name?.trim() || "-",
    eventId: item.hospital_event?.id ? Number(item.hospital_event.id) : null,
    eventName: item.hospital_event?.name?.trim() || "-",
    categoryLabel: formatEventAdCategory(category),
    allowStatus,
    allowStatusLabel: item.allow_status_label?.trim() || labelEventAdAllowStatus(allowStatus),
    adStatus,
    adStatusLabel: adStatus ? item.ad_status_label?.trim() || labelEventAdStatus(adStatus) : "-",
    managerName: item.manager_staff?.name?.trim() || "-",
  };
}

export function nextEventAdSortState(prev: EventAdSortState, field: EventAdSortField): EventAdSortState {
  if (prev.field !== field) return { field, direction: "desc", enabled: true };
  if (prev.enabled && prev.direction === "desc") return { field, direction: "asc", enabled: true };
  if (prev.enabled && prev.direction === "asc") return { ...DEFAULT_EVENT_AD_SORT, enabled: false };

  return { field, direction: "desc", enabled: true };
}

export function parseEventAdsTableState(searchParams: URLSearchParams) {
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const dateState = buildEventAdDateState(startDate, endDate);
  const dateTypes = normalizeListParam(searchParams.get("date_types")).filter((value): value is EventAdDateType =>
    EVENT_AD_DATE_TYPE_VALUE_SET.has(value as EventAdDateType),
  );
  const placements = normalizeListParam(searchParams.get("placement")).filter((value) =>
    EVENT_AD_PLACEMENT_VALUE_SET.has(value),
  );
  const allowStatuses = normalizeListParam(searchParams.get("allow_status")).filter((value) =>
    EVENT_AD_ALLOW_STATUS_VALUE_SET.has(value),
  );
  const adStatuses = normalizeListParam(searchParams.get("ad_status")).filter((value) =>
    EVENT_AD_STATUS_VALUE_SET.has(value),
  );
  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const sortFieldParam = searchParams.get("sort");
  const sortDirectionParam = searchParams.get("direction");
  const sortField =
    sortFieldParam && EVENT_AD_SORT_FIELDS.has(sortFieldParam as EventAdSortField)
      ? (sortFieldParam as EventAdSortField)
      : DEFAULT_EVENT_AD_SORT.field;
  const sortDirection: EventAdSortDirection = sortDirectionParam === "asc" ? "asc" : "desc";

  return {
    searchKeyword: searchParams.get("q")?.trim() ?? "",
    filters: {
      ...DEFAULT_EVENT_AD_FILTERS,
      dateTypes: dateTypes.length > 0 ? dateTypes : DEFAULT_EVENT_AD_FILTERS.dateTypes,
      dateRange: dateState.label,
      startDate,
      endDate,
      placements,
      allowStatuses,
      adStatuses,
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

export function buildEventAdsQuery({
  searchKeyword,
  appliedFilters,
  sortState,
  page,
}: {
  searchKeyword: string;
  appliedFilters: EventAdFilters;
  sortState: EventAdSortState;
  page: number;
}): EventAdsQuery {
  const query: EventAdsQuery = {
    sort: sortState.enabled ? sortState.field : DEFAULT_EVENT_AD_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_EVENT_AD_SORT.direction,
    per_page: EVENT_ADS_PER_PAGE,
    page,
  };

  const trimmedSearch = searchKeyword.trim();
  if (trimmedSearch) query.q = trimmedSearch;
  if (!isDefaultDateTypes(appliedFilters.dateTypes)) query.date_types = appliedFilters.dateTypes.join(",");
  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;
  if (appliedFilters.placements.length > 0) query.placement = appliedFilters.placements.join(",");
  if (appliedFilters.allowStatuses.length > 0) query.allow_status = appliedFilters.allowStatuses.join(",");
  if (appliedFilters.adStatuses.length > 0) query.ad_status = appliedFilters.adStatuses.join(",");

  return query;
}

export function buildEventAdsQueryString(query: EventAdsQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.date_types) params.set("date_types", query.date_types);
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.placement) params.set("placement", query.placement);
  if (query.allow_status) params.set("allow_status", query.allow_status);
  if (query.ad_status) params.set("ad_status", query.ad_status);
  if (query.sort !== DEFAULT_EVENT_AD_SORT.field || !DEFAULT_EVENT_AD_SORT.enabled) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_EVENT_AD_SORT.direction) params.set("direction", query.direction);
  if (query.page > 1) params.set("page", String(query.page));

  return params.toString();
}

function isDefaultDateTypes(dateTypes: EventAdDateType[]) {
  return dateTypes.length === 1 && dateTypes[0] === DEFAULT_EVENT_AD_FILTERS.dateTypes[0];
}

function normalizeListParam(value: string | null | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
