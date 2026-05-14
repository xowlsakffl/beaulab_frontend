import type { DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

export type HospitalEvaluationAuthor = {
  id?: number | null;
  name?: string | null;
  nickname?: string | null;
  email?: string | null;
};

export type HospitalEvaluationHospital = {
  id?: number | null;
  name?: string | null;
  business_number?: string | null;
};

export type HospitalEvaluationDoctor = {
  id?: number | null;
  name?: string | null;
  position?: string | null;
};

export type HospitalEvaluationCategory = {
  id?: number | null;
  code?: string | null;
  domain?: string | null;
  name?: string | null;
  full_path?: string | null;
  is_primary?: boolean | null;
};

export type HospitalEvaluationReceipt = {
  status?: string | null;
  label?: string | null;
};

export type HospitalEvaluationApiItem = {
  id: number;
  created_at?: string | null;
  category_domain?: string | null;
  author?: HospitalEvaluationAuthor | null;
  hospital?: HospitalEvaluationHospital | null;
  doctor?: HospitalEvaluationDoctor | null;
  categories?: HospitalEvaluationCategory[] | null;
  phone?: string | null;
  cost?: number | null;
  average_rating?: number | null;
  status?: string | null;
  view_count?: number | null;
  receipt?: HospitalEvaluationReceipt | null;
};

export type HospitalEvaluationRow = {
  id: number;
  createdAt: string;
  reviewType: string;
  authorName: string;
  hospitalName: string;
  doctorName: string;
  phone: string;
  cost: number;
  averageRating: number;
  status: string;
  isVisible: boolean;
  visibilityChangeLocked: boolean;
  viewCount: number;
  receiptStatus: string;
  receiptLabel: string;
};

export type HospitalEvaluationSortField =
  | "id"
  | "cost"
  | "average_rating"
  | "status"
  | "view_count"
  | "receipt_status"
  | "created_at"
  | "updated_at";

export type HospitalEvaluationSortDirection = "asc" | "desc";

export type HospitalEvaluationSortState = {
  field: HospitalEvaluationSortField;
  direction: HospitalEvaluationSortDirection;
  enabled: boolean;
};

export type HospitalEvaluationFilters = {
  reviewType: string;
  visibilityStatus: string;
  rating: string;
  costMin: string;
  costMax: string;
  viewCountMin: string;
  viewCountMax: string;
  dateRange: string;
  startDate: string;
  endDate: string;
};

export type HospitalEvaluationsQuery = {
  q?: string;
  status?: string;
  category_domain?: string;
  ratings?: string;
  cost_min?: string;
  cost_max?: string;
  view_count_min?: string;
  view_count_max?: string;
  start_date?: string;
  end_date?: string;
  sort: HospitalEvaluationSortField;
  direction: HospitalEvaluationSortDirection;
  per_page: number;
  page: number;
};

export const HOSPITAL_EVALUATIONS_PER_PAGE = 15;

export const DEFAULT_HOSPITAL_EVALUATION_SORT: HospitalEvaluationSortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

export const DEFAULT_HOSPITAL_EVALUATION_FILTERS: HospitalEvaluationFilters = {
  reviewType: "",
  visibilityStatus: "",
  rating: "",
  costMin: "",
  costMax: "",
  viewCountMin: "",
  viewCountMax: "",
  dateRange: "",
  startDate: "",
  endDate: "",
};

export const HOSPITAL_EVALUATION_REVIEW_TYPE_OPTIONS = [
  { value: "", label: "전체" },
  { value: "HOSPITAL_EVALUATION_SURGERY", label: "성형후기" },
  { value: "HOSPITAL_EVALUATION_TREATMENT", label: "시술후기" },
  { value: "HOSPITAL_EVALUATION_CONSULTATION", label: "상담후기" },
];

export const HOSPITAL_EVALUATION_VISIBILITY_OPTIONS = [
  { value: "", label: "전체" },
  { value: "ACTIVE", label: "노출" },
  { value: "INACTIVE", label: "미노출" },
];

export const HOSPITAL_EVALUATION_RATING_OPTIONS = [
  { value: "", label: "전체" },
  { value: "1", label: "1점" },
  { value: "2", label: "2점" },
  { value: "3", label: "3점" },
  { value: "4", label: "4점" },
  { value: "5", label: "5점" },
];

export const HOSPITAL_EVALUATION_DATE_PRESET_OPTIONS = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "recent7", label: "최근 7일" },
  { key: "recent30", label: "최근 30일" },
] as const satisfies readonly DatePresetOption[];

export type HospitalEvaluationDatePresetKey = (typeof HOSPITAL_EVALUATION_DATE_PRESET_OPTIONS)[number]["key"];

const HOSPITAL_EVALUATION_SORT_FIELDS = new Set<HospitalEvaluationSortField>([
  "id",
  "cost",
  "average_rating",
  "status",
  "view_count",
  "receipt_status",
  "created_at",
  "updated_at",
]);
const HOSPITAL_EVALUATION_REVIEW_TYPE_VALUE_SET = new Set(HOSPITAL_EVALUATION_REVIEW_TYPE_OPTIONS.map((option) => option.value));
const HOSPITAL_EVALUATION_VISIBILITY_VALUE_SET = new Set(HOSPITAL_EVALUATION_VISIBILITY_OPTIONS.map((option) => option.value));
const HOSPITAL_EVALUATION_RATING_VALUE_SET = new Set(HOSPITAL_EVALUATION_RATING_OPTIONS.map((option) => option.value));

export function labelHospitalEvaluationReviewType(domain?: string | null) {
  return HOSPITAL_EVALUATION_REVIEW_TYPE_OPTIONS.find((option) => option.value === domain)?.label || "-";
}

export function labelHospitalEvaluationVisibilityStatus(status?: string | null) {
  return status === "INACTIVE" ? "미노출" : "노출";
}

export function formatHospitalEvaluationAuthorName(author?: HospitalEvaluationAuthor | null) {
  return author?.nickname?.trim() || author?.name?.trim() || "-";
}

export function formatHospitalEvaluationDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return formatLocalDate(date);
}

export function formatHospitalEvaluationCost(value: number) {
  return `${value.toLocaleString()}만원`;
}

export function formatHospitalEvaluationRating(value: number) {
  return value.toFixed(1);
}

export function formatHospitalEvaluationReceiptLabel(receipt?: HospitalEvaluationReceipt | null) {
  const status = receipt?.status?.trim() || "NONE";
  if (status === "NONE") return "-";

  return receipt?.label?.trim() || "-";
}

export function normalizeHospitalEvaluation(item: HospitalEvaluationApiItem): HospitalEvaluationRow {
  const status = item.status?.trim() || "ACTIVE";
  const categoryDomain = item.category_domain?.trim() || item.categories?.[0]?.domain?.trim() || "";

  return {
    id: item.id,
    createdAt: formatHospitalEvaluationDate(item.created_at),
    reviewType: labelHospitalEvaluationReviewType(categoryDomain),
    authorName: formatHospitalEvaluationAuthorName(item.author),
    hospitalName: item.hospital?.name?.trim() || "-",
    doctorName: item.doctor?.name?.trim() || "-",
    phone: item.phone?.trim() || "-",
    cost: Number(item.cost ?? 0),
    averageRating: Number(item.average_rating ?? 0),
    status,
    isVisible: status === "ACTIVE",
    visibilityChangeLocked: false,
    viewCount: Number(item.view_count ?? 0),
    receiptStatus: item.receipt?.status?.trim() || "NONE",
    receiptLabel: formatHospitalEvaluationReceiptLabel(item.receipt),
  };
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

export function formatHospitalEvaluationDateRange(range?: DateRange) {
  if (!range?.from) return "";

  const fromDate = formatFilterDisplayDate(range.from);
  if (!range.to) return fromDate;

  return `${fromDate} ~ ${formatFilterDisplayDate(range.to)}`;
}

export function normalizeRangeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function buildHospitalEvaluationPresetDateRange(preset: HospitalEvaluationDatePresetKey): DateRange {
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

export function mapDateRangeToHospitalEvaluationFilter(range?: DateRange) {
  return {
    label: formatHospitalEvaluationDateRange(range),
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

export function buildHospitalEvaluationDateState(startDate: string, endDate: string) {
  const from = startDate ? parseDateParam(startDate) : undefined;
  const to = endDate ? parseDateParam(endDate) : undefined;
  const range = from || to ? { from: from ?? to, to: to ?? from } : undefined;

  return {
    range,
    label: formatHospitalEvaluationDateRange(range),
  };
}

export function normalizeMetricBound(value: string | null | undefined) {
  const trimmedValue = (value ?? "").trim();
  if (!/^\d+$/.test(trimmedValue)) return "";

  return trimmedValue.replace(/^0+(?=\d)/, "");
}

export function nextHospitalEvaluationSortState(
  prev: HospitalEvaluationSortState,
  field: HospitalEvaluationSortField,
): HospitalEvaluationSortState {
  if (prev.field !== field) return { field, direction: "desc", enabled: true };
  if (prev.enabled && prev.direction === "desc") return { field, direction: "asc", enabled: true };
  if (prev.enabled && prev.direction === "asc") return { ...DEFAULT_HOSPITAL_EVALUATION_SORT, enabled: false };

  return { field, direction: "desc", enabled: true };
}

export function parseHospitalEvaluationsTableState(searchParams: URLSearchParams) {
  const reviewType = searchParams.get("category_domain") ?? "";
  const visibilityStatus = searchParams.get("status") ?? "";
  const rating = searchParams.get("ratings") ?? searchParams.get("rating") ?? "";
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const createdDateState = buildHospitalEvaluationDateState(startDate, endDate);
  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const sortFieldParam = searchParams.get("sort");
  const sortDirectionParam = searchParams.get("direction");
  const sortField = sortFieldParam && HOSPITAL_EVALUATION_SORT_FIELDS.has(sortFieldParam as HospitalEvaluationSortField)
    ? (sortFieldParam as HospitalEvaluationSortField)
    : DEFAULT_HOSPITAL_EVALUATION_SORT.field;
  const sortDirection: HospitalEvaluationSortDirection = sortDirectionParam === "asc" ? "asc" : "desc";

  return {
    searchKeyword: searchParams.get("q")?.trim() ?? "",
    filters: {
      reviewType: HOSPITAL_EVALUATION_REVIEW_TYPE_VALUE_SET.has(reviewType) ? reviewType : "",
      visibilityStatus: HOSPITAL_EVALUATION_VISIBILITY_VALUE_SET.has(visibilityStatus) ? visibilityStatus : "",
      rating: HOSPITAL_EVALUATION_RATING_VALUE_SET.has(rating) ? rating : "",
      costMin: normalizeMetricBound(searchParams.get("cost_min")),
      costMax: normalizeMetricBound(searchParams.get("cost_max")),
      viewCountMin: normalizeMetricBound(searchParams.get("view_count_min")),
      viewCountMax: normalizeMetricBound(searchParams.get("view_count_max")),
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
    page,
  };
}

export function buildHospitalEvaluationsQuery({
  searchKeyword,
  appliedFilters,
  sortState,
  page,
}: {
  searchKeyword: string;
  appliedFilters: HospitalEvaluationFilters;
  sortState: HospitalEvaluationSortState;
  page: number;
}): HospitalEvaluationsQuery {
  const query: HospitalEvaluationsQuery = {
    sort: sortState.enabled ? sortState.field : DEFAULT_HOSPITAL_EVALUATION_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_HOSPITAL_EVALUATION_SORT.direction,
    per_page: HOSPITAL_EVALUATIONS_PER_PAGE,
    page,
  };

  const trimmedSearch = searchKeyword.trim();
  if (trimmedSearch) query.q = trimmedSearch;
  if (appliedFilters.visibilityStatus === "ACTIVE" || appliedFilters.visibilityStatus === "INACTIVE") {
    query.status = appliedFilters.visibilityStatus;
  }
  if (appliedFilters.reviewType) query.category_domain = appliedFilters.reviewType;
  if (appliedFilters.rating) query.ratings = appliedFilters.rating;

  const costMin = normalizeMetricBound(appliedFilters.costMin);
  const costMax = normalizeMetricBound(appliedFilters.costMax);
  if (costMin) query.cost_min = costMin;
  if (costMax) query.cost_max = costMax;

  const viewCountMin = normalizeMetricBound(appliedFilters.viewCountMin);
  const viewCountMax = normalizeMetricBound(appliedFilters.viewCountMax);
  if (viewCountMin) query.view_count_min = viewCountMin;
  if (viewCountMax) query.view_count_max = viewCountMax;

  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;

  return query;
}

export function buildHospitalEvaluationsQueryString(query: HospitalEvaluationsQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.category_domain) params.set("category_domain", query.category_domain);
  if (query.ratings) params.set("ratings", query.ratings);
  if (query.cost_min) params.set("cost_min", query.cost_min);
  if (query.cost_max) params.set("cost_max", query.cost_max);
  if (query.view_count_min) params.set("view_count_min", query.view_count_min);
  if (query.view_count_max) params.set("view_count_max", query.view_count_max);
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.sort !== DEFAULT_HOSPITAL_EVALUATION_SORT.field) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_HOSPITAL_EVALUATION_SORT.direction) params.set("direction", query.direction);
  if (query.page !== 1) params.set("page", String(query.page));

  return params.toString();
}
