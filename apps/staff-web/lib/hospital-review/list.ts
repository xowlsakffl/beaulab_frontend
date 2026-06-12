import type { CheckboxFilterOption, DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

import { CATEGORY_USAGES, HOSPITAL_REVIEW_CATEGORY_DOMAINS } from "@/lib/common/category";
import {
  formatPostManagementStatusLabel,
  isVisibilityLockedByReport,
  normalizePostManagementStatus,
  VISIBILITY_LOCKING_REPORT_STATUS_FILTER_OPTIONS,
  VISIBLE_REPORT_STATUS_VALUE_SET,
  type ContentReportSummary,
} from "@/lib/common/content-report";
import { resolveMediaAssetUrl, type MediaVariantPreference } from "@/lib/common/media";

export type HospitalReviewBoardType = "surgery" | "treatment";

export type HospitalReviewBoardConfig = {
  type: HospitalReviewBoardType;
  title: string;
  listPath: string;
  categoryDomain: string;
  categoryUsage: string;
};

export type HospitalReviewAuthor = {
  id?: number | null;
  name?: string | null;
  nickname?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type HospitalReviewCategory = {
  id?: number | null;
  code?: string | null;
  domain?: string | null;
  name?: string | null;
  full_path?: string | null;
  parent_id?: number | null;
  depth?: number | null;
  is_primary?: boolean | null;
};

export type HospitalReviewHospital = {
  id?: number | null;
  name?: string | null;
  business_number?: string | null;
};

export type HospitalReviewDoctor = {
  id?: number | null;
  name?: string | null;
  position?: string | null;
};

export type HospitalReviewMediaAsset = {
  id: number;
  collection?: string | null;
  disk?: string | null;
  path?: string | null;
  url?: string | null;
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

export type HospitalReviewApiItem = {
  id: number;
  created_at?: string | null;
  author?: HospitalReviewAuthor | null;
  hospital?: HospitalReviewHospital | null;
  doctor?: HospitalReviewDoctor | null;
  categories?: HospitalReviewCategory[] | null;
  first_image?: HospitalReviewMediaAsset | null;
  image_count?: number | null;
  before_images?: HospitalReviewMediaAsset[] | null;
  after_images?: HospitalReviewMediaAsset[] | null;
  cost?: number | null;
  rating?: number | null;
  status?: string | null;
  is_main_featured?: boolean | null;
  is_sub_featured?: boolean | null;
  like_count?: number | null;
  save_count?: number | null;
  comment_count?: number | null;
  view_count?: number | null;
  report?: ContentReportSummary | null;
};

export type HospitalReviewRow = {
  id: number;
  createdAt: string;
  authorName: string;
  hospitalName: string;
  doctorName: string;
  categoryName: string;
  firstImage: HospitalReviewMediaAsset | null;
  beforeImageCount: number;
  afterImageCount: number;
  cost: number;
  rating: number;
  status: string;
  isVisible: boolean;
  visibilityChangeLocked: boolean;
  reportStatus: string;
  reportStatusLabel: string;
  isMainFeatured: boolean;
  isSubFeatured: boolean;
  likeCount: number;
  saveCount: number;
  commentCount: number;
  viewCount: number;
};

export type HospitalReviewMetricField = "" | "like_count" | "save_count" | "comment_count" | "view_count";
export type HospitalReviewSortField =
  | "id"
  | "cost"
  | "rating"
  | "status"
  | "is_main_featured"
  | "is_sub_featured"
  | "view_count"
  | "comment_count"
  | "like_count"
  | "save_count"
  | "created_at"
  | "updated_at";
export type HospitalReviewSortDirection = "asc" | "desc";

export type HospitalReviewSortState = {
  field: HospitalReviewSortField;
  direction: HospitalReviewSortDirection;
  enabled: boolean;
};

export type HospitalReviewFilters = {
  categoryIds: string[];
  majorCategoryId: string;
  middleCategoryId: string;
  smallCategoryId: string;
  visibilityStatus: string;
  reportStatus: string;
  ratings: string[];
  best: string;
  metricField: HospitalReviewMetricField;
  metricMin: string;
  metricMax: string;
  dateRange: string;
  startDate: string;
  endDate: string;
};

export type HospitalReviewsQuery = {
  q?: string;
  status?: string;
  report_status?: string;
  category_domain: string;
  category_ids?: string;
  ratings?: string;
  is_main_featured?: "1";
  is_sub_featured?: "1";
  metric?: HospitalReviewMetricField;
  metric_min?: string;
  metric_max?: string;
  start_date?: string;
  end_date?: string;
  sort: HospitalReviewSortField;
  direction: HospitalReviewSortDirection;
  per_page: number;
  page: number;
};

export const HOSPITAL_REVIEW_BOARD_CONFIGS: Record<HospitalReviewBoardType, HospitalReviewBoardConfig> = {
  surgery: {
    type: "surgery",
    title: "성형후기",
    listPath: "/reviews/surgery-reviews",
    categoryDomain: HOSPITAL_REVIEW_CATEGORY_DOMAINS.SURGERY,
    categoryUsage: CATEGORY_USAGES.HOSPITAL_REVIEW_SURGERY,
  },
  treatment: {
    type: "treatment",
    title: "시술후기",
    listPath: "/reviews/treatment-reviews",
    categoryDomain: HOSPITAL_REVIEW_CATEGORY_DOMAINS.TREATMENT,
    categoryUsage: CATEGORY_USAGES.HOSPITAL_REVIEW_TREATMENT,
  },
};

export const HOSPITAL_REVIEWS_PER_PAGE = 15;
export const DEFAULT_HOSPITAL_REVIEW_SORT: HospitalReviewSortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

export const DEFAULT_HOSPITAL_REVIEW_FILTERS: HospitalReviewFilters = {
  categoryIds: [],
  majorCategoryId: "",
  middleCategoryId: "",
  smallCategoryId: "",
  visibilityStatus: "",
  reportStatus: "",
  ratings: [],
  best: "",
  metricField: "",
  metricMin: "",
  metricMax: "",
  dateRange: "",
  startDate: "",
  endDate: "",
};

export const HOSPITAL_REVIEW_VISIBILITY_OPTIONS = [
  { value: "", label: "전체" },
  { value: "ACTIVE", label: "노출" },
  { value: "INACTIVE", label: "미노출" },
];

export const HOSPITAL_REVIEW_REPORT_STATUS_OPTIONS = VISIBILITY_LOCKING_REPORT_STATUS_FILTER_OPTIONS;

export const HOSPITAL_REVIEW_RATING_OPTIONS: CheckboxFilterOption[] = [
  { value: "1", label: "1점" },
  { value: "2", label: "2점" },
  { value: "3", label: "3점" },
  { value: "4", label: "4점" },
  { value: "5", label: "5점" },
];

export const HOSPITAL_REVIEW_BEST_OPTIONS = [
  { value: "", label: "전체" },
  { value: "main", label: "메인" },
  { value: "sub", label: "부위" },
];

export const HOSPITAL_REVIEW_METRIC_OPTIONS: { value: HospitalReviewMetricField; label: string }[] = [
  { value: "", label: "선택" },
  { value: "like_count", label: "좋아요수" },
  { value: "save_count", label: "저장횟수" },
  { value: "comment_count", label: "댓글수" },
  { value: "view_count", label: "조회수" },
];

export const HOSPITAL_REVIEW_DATE_PRESET_OPTIONS = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "recent7", label: "최근 7일" },
  { key: "recent30", label: "최근 30일" },
] as const satisfies readonly DatePresetOption[];

export type HospitalReviewDatePresetKey = (typeof HOSPITAL_REVIEW_DATE_PRESET_OPTIONS)[number]["key"];

const HOSPITAL_REVIEW_SORT_FIELDS = new Set<HospitalReviewSortField>([
  "id",
  "cost",
  "rating",
  "status",
  "is_main_featured",
  "is_sub_featured",
  "view_count",
  "comment_count",
  "like_count",
  "save_count",
  "created_at",
  "updated_at",
]);
const HOSPITAL_REVIEW_VISIBILITY_VALUE_SET = new Set(HOSPITAL_REVIEW_VISIBILITY_OPTIONS.map((option) => option.value));
const HOSPITAL_REVIEW_RATING_VALUE_SET = new Set(HOSPITAL_REVIEW_RATING_OPTIONS.map((option) => option.value));
const HOSPITAL_REVIEW_METRIC_VALUE_SET = new Set<HospitalReviewMetricField>(["like_count", "save_count", "comment_count", "view_count"]);

export function resolveHospitalReviewMediaUrl(
  media?: HospitalReviewMediaAsset | null,
  preferredVariant: MediaVariantPreference = "original",
): string | null {
  return resolveMediaAssetUrl(media, preferredVariant);
}

export function labelHospitalReviewVisibilityStatus(status?: string | null) {
  return status === "INACTIVE" ? "미노출" : "노출";
}

export function formatHospitalReviewCategoryName(category?: HospitalReviewCategory | null) {
  const fullPath = category?.full_path?.trim();
  if (fullPath) return fullPath;

  const name = category?.name?.trim();
  if (name) return name;

  return "";
}

function splitHospitalReviewCategoryPath(category?: HospitalReviewCategory | null) {
  const rawPath = category?.full_path?.trim() || category?.name?.trim() || "";

  return rawPath
    .split(">")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatHospitalReviewCategoryPath(category?: HospitalReviewCategory | null, maxDepth = 2) {
  const pathItems = splitHospitalReviewCategoryPath(category);
  if (pathItems.length === 0) return "";

  return pathItems.slice(0, maxDepth).join(" > ");
}

export function formatHospitalReviewCategories(categories?: HospitalReviewCategory[] | null, maxDepth = 2) {
  const names = Array.from(new Set(
    (categories ?? [])
      .map((category) => formatHospitalReviewCategoryPath(category, maxDepth))
      .filter(Boolean),
  ));

  return names.length > 0 ? names.join("\n") : "-";
}

export function formatHospitalReviewAuthorName(author?: HospitalReviewAuthor | null) {
  return author?.nickname?.trim() || author?.name?.trim() || "-";
}

export function formatHospitalReviewDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return formatLocalDateTime(date);
}

export function formatHospitalReviewCost(value: number) {
  return `${value.toLocaleString()}만원`;
}

export function formatHospitalReviewRating(value: number) {
  return String(value);
}

export function normalizeHospitalReview(item: HospitalReviewApiItem): HospitalReviewRow {
  const status = item.status?.trim() || "ACTIVE";
  const beforeImages = item.before_images ?? [];
  const afterImages = item.after_images ?? [];
  const imageCount = Number(item.image_count ?? beforeImages.length + afterImages.length);

  return {
    id: item.id,
    createdAt: formatHospitalReviewDate(item.created_at),
    authorName: formatHospitalReviewAuthorName(item.author),
    hospitalName: item.hospital?.name?.trim() || "-",
    doctorName: item.doctor?.name?.trim() || "-",
    categoryName: formatHospitalReviewCategories(item.categories),
    firstImage: item.first_image ?? beforeImages[0] ?? afterImages[0] ?? null,
    beforeImageCount: imageCount,
    afterImageCount: 0,
    cost: Number(item.cost ?? 0),
    rating: Number(item.rating ?? 0),
    status,
    isVisible: status === "ACTIVE",
    visibilityChangeLocked: isVisibilityLockedByReport(item.report),
    reportStatus: normalizePostManagementStatus(item.report, status),
    reportStatusLabel: formatPostManagementStatusLabel(item.report, status),
    isMainFeatured: Boolean(item.is_main_featured),
    isSubFeatured: Boolean(item.is_sub_featured),
    likeCount: Number(item.like_count ?? 0),
    saveCount: Number(item.save_count ?? 0),
    commentCount: Number(item.comment_count ?? 0),
    viewCount: Number(item.view_count ?? 0),
  };
}

export function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatLocalDateTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${formatLocalDate(date)} ${hours}:${minutes}`;
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

export function buildHospitalReviewPresetDateRange(preset: HospitalReviewDatePresetKey): DateRange {
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

export function mapDateRangeToHospitalReviewFilter(range?: DateRange) {
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

export function buildHospitalReviewDateState(startDate: string, endDate: string) {
  const from = startDate ? parseDateParam(startDate) : undefined;
  const to = endDate ? parseDateParam(endDate) : undefined;
  const range = from || to ? { from: from ?? to, to: to ?? from } : undefined;

  return {
    range,
    label: formatDateRange(range),
  };
}

export function normalizeMetricBound(value: string | null | undefined) {
  const trimmedValue = (value ?? "").trim();
  if (!/^\d+$/.test(trimmedValue)) return "";

  return trimmedValue.replace(/^0+(?=\d)/, "");
}

export function nextHospitalReviewSortState(
  prev: HospitalReviewSortState,
  field: HospitalReviewSortField,
): HospitalReviewSortState {
  if (prev.field !== field) return { field, direction: "desc", enabled: true };
  if (prev.enabled && prev.direction === "desc") return { field, direction: "asc", enabled: true };
  if (prev.enabled && prev.direction === "asc") return { ...DEFAULT_HOSPITAL_REVIEW_SORT, enabled: false };

  return { field, direction: "desc", enabled: true };
}

export function parseHospitalReviewsTableState(searchParams: URLSearchParams) {
  const categoryIds = normalizePositiveIdListParam(
    searchParams.get("category_ids") ?? searchParams.get("category_id"),
  );
  const visibilityStatus = searchParams.get("status") ?? "";
  const reportStatus = searchParams.get("report_status") ?? "";
  const ratings = normalizeListParam(searchParams.get("ratings") ?? searchParams.get("rating"))
    .filter((value) => HOSPITAL_REVIEW_RATING_VALUE_SET.has(value));
  const metricParam = searchParams.get("metric");
  const metricField = metricParam && HOSPITAL_REVIEW_METRIC_VALUE_SET.has(metricParam as HospitalReviewMetricField)
    ? (metricParam as HospitalReviewMetricField)
    : DEFAULT_HOSPITAL_REVIEW_FILTERS.metricField;
  const best = parseBooleanParam(searchParams.get("is_main_featured"))
    ? "main"
    : parseBooleanParam(searchParams.get("is_sub_featured"))
      ? "sub"
      : "";
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const createdDateState = buildHospitalReviewDateState(startDate, endDate);

  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const sortFieldParam = searchParams.get("sort");
  const sortDirectionParam = searchParams.get("direction");
  const sortField = sortFieldParam && HOSPITAL_REVIEW_SORT_FIELDS.has(sortFieldParam as HospitalReviewSortField)
    ? (sortFieldParam as HospitalReviewSortField)
    : DEFAULT_HOSPITAL_REVIEW_SORT.field;
  const sortDirection: HospitalReviewSortDirection = sortDirectionParam === "asc" ? "asc" : "desc";

  return {
    searchKeyword: searchParams.get("q")?.trim() ?? "",
    filters: {
      categoryIds,
      majorCategoryId: "",
      middleCategoryId: "",
      smallCategoryId: "",
      visibilityStatus: HOSPITAL_REVIEW_VISIBILITY_VALUE_SET.has(visibilityStatus) ? visibilityStatus : "",
      reportStatus: VISIBLE_REPORT_STATUS_VALUE_SET.has(reportStatus) ? reportStatus : "",
      ratings,
      best,
      metricField,
      metricMin: normalizeMetricBound(searchParams.get("metric_min")),
      metricMax: normalizeMetricBound(searchParams.get("metric_max")),
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

export function buildHospitalReviewsQuery({
  searchKeyword,
  appliedFilters,
  sortState,
  page,
  categoryDomain,
}: {
  searchKeyword: string;
  appliedFilters: HospitalReviewFilters;
  sortState: HospitalReviewSortState;
  page: number;
  categoryDomain: string;
}): HospitalReviewsQuery {
  const query: HospitalReviewsQuery = {
    category_domain: categoryDomain,
    sort: sortState.enabled ? sortState.field : DEFAULT_HOSPITAL_REVIEW_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_HOSPITAL_REVIEW_SORT.direction,
    per_page: HOSPITAL_REVIEWS_PER_PAGE,
    page,
  };

  const trimmedSearch = searchKeyword.trim();
  if (trimmedSearch) query.q = trimmedSearch;
  if (appliedFilters.visibilityStatus === "ACTIVE" || appliedFilters.visibilityStatus === "INACTIVE") {
    query.status = appliedFilters.visibilityStatus;
  }
  if (VISIBLE_REPORT_STATUS_VALUE_SET.has(appliedFilters.reportStatus)) {
    query.report_status = appliedFilters.reportStatus;
  }

  const selectedCategoryId = appliedFilters.smallCategoryId
    || appliedFilters.middleCategoryId
    || appliedFilters.majorCategoryId
    || appliedFilters.categoryIds[0]
    || "";
  const categoryIds = [selectedCategoryId].filter((value) => /^[1-9]\d*$/.test(value));
  if (categoryIds.length > 0) query.category_ids = Array.from(new Set(categoryIds)).join(",");

  const ratings = uniqueAllowedValues(appliedFilters.ratings, HOSPITAL_REVIEW_RATING_VALUE_SET);
  if (ratings.length > 0) query.ratings = ratings.join(",");

  if (appliedFilters.best === "main") query.is_main_featured = "1";
  if (appliedFilters.best === "sub") query.is_sub_featured = "1";

  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;

  const metricMin = normalizeMetricBound(appliedFilters.metricMin);
  const metricMax = normalizeMetricBound(appliedFilters.metricMax);
  if ((metricMin || metricMax) && HOSPITAL_REVIEW_METRIC_VALUE_SET.has(appliedFilters.metricField)) {
    query.metric = appliedFilters.metricField;
    if (metricMin) query.metric_min = metricMin;
    if (metricMax) query.metric_max = metricMax;
  }

  return query;
}

export function buildHospitalReviewsQueryString(query: HospitalReviewsQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.report_status) params.set("report_status", query.report_status);
  params.set("category_domain", query.category_domain);
  if (query.category_ids) params.set("category_ids", query.category_ids);
  if (query.ratings) params.set("ratings", query.ratings);
  if (query.is_main_featured) params.set("is_main_featured", query.is_main_featured);
  if (query.is_sub_featured) params.set("is_sub_featured", query.is_sub_featured);
  if (query.metric) params.set("metric", query.metric);
  if (query.metric_min) params.set("metric_min", query.metric_min);
  if (query.metric_max) params.set("metric_max", query.metric_max);
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.sort !== DEFAULT_HOSPITAL_REVIEW_SORT.field) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_HOSPITAL_REVIEW_SORT.direction) params.set("direction", query.direction);
  if (query.page !== 1) params.set("page", String(query.page));

  return params.toString();
}

function normalizeListParam(value: string | null) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizePositiveIdListParam(value: string | null) {
  return normalizeListParam(value).filter((item) => /^[1-9]\d*$/.test(item));
}

function parseBooleanParam(value: string | null) {
  return value === "1" || value === "true";
}

function uniqueAllowedValues(values: string[], allowedSet: Set<string>) {
  return Array.from(new Set(values.map((value) => value.trim()).filter((value) => allowedSet.has(value))));
}
