import {
  DEFAULT_HOSPITAL_REVIEW_FILTERS,
  HOSPITAL_REVIEW_VISIBILITY_OPTIONS,
  HOSPITAL_REVIEWS_PER_PAGE,
  formatHospitalReviewAuthorName,
  formatHospitalReviewCategories,
  formatHospitalReviewDate,
  normalizeMetricBound,
  type HospitalReviewAuthor,
  type HospitalReviewCategory,
  type HospitalReviewFilters,
  type HospitalReviewMediaAsset,
  type HospitalReviewSortDirection,
} from "@/lib/hospital-review/list";
import {
  formatVisibleReportStatusLabel,
  isVisibilityLockedByReport,
  type ContentReportSummary,
} from "@/lib/common/content-report";

export type HospitalReviewCommentParent = {
  id?: number | null;
  title?: string | null;
  categories?: HospitalReviewCategory[] | null;
  first_image?: HospitalReviewMediaAsset | null;
  image_count?: number | null;
  before_images?: HospitalReviewMediaAsset[] | null;
  after_images?: HospitalReviewMediaAsset[] | null;
};

export type HospitalReviewCommentApiItem = {
  id: number;
  created_at?: string | null;
  author?: HospitalReviewAuthor | null;
  category?: HospitalReviewCategory | null;
  categories?: HospitalReviewCategory[] | null;
  parent?: HospitalReviewCommentParent | null;
  content?: string | null;
  content_preview?: string | null;
  status?: string | null;
  like_count?: number | null;
  report?: ContentReportSummary | null;
};

export type HospitalReviewCommentRow = {
  id: number;
  createdAt: string;
  categoryName: string;
  authorName: string;
  contentPreview: string;
  parentReviewId: number | null;
  parentReviewTitle: string;
  firstImage: HospitalReviewMediaAsset | null;
  imageCount: number;
  status: string;
  isVisible: boolean;
  visibilityChangeLocked: boolean;
  reportStatusLabel: string;
  likeCount: number;
};

export type HospitalReviewCommentSortField =
  | "id"
  | "status"
  | "like_count"
  | "created_at"
  | "updated_at";

export type HospitalReviewCommentSortState = {
  field: HospitalReviewCommentSortField;
  direction: HospitalReviewSortDirection;
  enabled: boolean;
};

export type HospitalReviewCommentsQuery = {
  q?: string;
  status?: string;
  category_domain: string;
  category_ids?: string;
  metric_min?: string;
  metric_max?: string;
  start_date?: string;
  end_date?: string;
  sort: HospitalReviewCommentSortField;
  direction: HospitalReviewSortDirection;
  per_page: number;
  page: number;
};

export const DEFAULT_HOSPITAL_REVIEW_COMMENT_SORT: HospitalReviewCommentSortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

const HOSPITAL_REVIEW_COMMENT_SORT_FIELDS = new Set<HospitalReviewCommentSortField>([
  "id",
  "status",
  "like_count",
  "created_at",
  "updated_at",
]);
const HOSPITAL_REVIEW_COMMENT_VISIBILITY_SET = new Set(HOSPITAL_REVIEW_VISIBILITY_OPTIONS.map((option) => option.value));

export function normalizeHospitalReviewComment(item: HospitalReviewCommentApiItem): HospitalReviewCommentRow {
  const status = item.status?.trim() || "ACTIVE";
  const beforeImages = item.parent?.before_images ?? [];
  const afterImages = item.parent?.after_images ?? [];
  const categories = normalizeHospitalReviewCommentCategories(item);

  return {
    id: item.id,
    createdAt: formatHospitalReviewDate(item.created_at),
    categoryName: formatHospitalReviewCategories(categories, 3),
    authorName: formatHospitalReviewAuthorName(item.author),
    contentPreview: item.content_preview?.trim() || buildHospitalReviewCommentContentPreview(item.content),
    parentReviewId: item.parent?.id ? Number(item.parent.id) : null,
    parentReviewTitle: item.parent?.title?.trim() || "-",
    firstImage: item.parent?.first_image ?? beforeImages[0] ?? afterImages[0] ?? null,
    imageCount: Number(item.parent?.image_count ?? beforeImages.length + afterImages.length),
    status,
    isVisible: status === "ACTIVE",
    visibilityChangeLocked: isVisibilityLockedByReport(item.report),
    reportStatusLabel: formatVisibleReportStatusLabel(item.report),
    likeCount: Number(item.like_count ?? 0),
  };
}

function normalizeHospitalReviewCommentCategories(item: HospitalReviewCommentApiItem): HospitalReviewCategory[] {
  if (Array.isArray(item.categories) && item.categories.length > 0) {
    return item.categories;
  }

  if (Array.isArray(item.parent?.categories) && item.parent.categories.length > 0) {
    return item.parent.categories;
  }

  return item.category ? [item.category] : [];
}

export function buildHospitalReviewCommentContentPreview(content?: string | null, maxLength = 140) {
  const normalized = (content ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, "\"")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "-";
  if (normalized.length <= maxLength) return normalized;

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export function parseHospitalReviewCommentSortState(searchParams: URLSearchParams): HospitalReviewCommentSortState {
  const sortFieldParam = searchParams.get("sort");
  const sortDirectionParam = searchParams.get("direction");
  const sortField = sortFieldParam && HOSPITAL_REVIEW_COMMENT_SORT_FIELDS.has(sortFieldParam as HospitalReviewCommentSortField)
    ? (sortFieldParam as HospitalReviewCommentSortField)
    : DEFAULT_HOSPITAL_REVIEW_COMMENT_SORT.field;
  const sortDirection: HospitalReviewSortDirection = sortDirectionParam === "asc" ? "asc" : "desc";

  return {
    field: sortField,
    direction: sortDirection,
    enabled: Boolean(sortFieldParam || sortDirectionParam),
  };
}

export function nextHospitalReviewCommentSortState(
  prev: HospitalReviewCommentSortState,
  field: HospitalReviewCommentSortField,
): HospitalReviewCommentSortState {
  if (prev.field !== field) return { field, direction: "desc", enabled: true };
  if (prev.enabled && prev.direction === "desc") return { field, direction: "asc", enabled: true };
  if (prev.enabled && prev.direction === "asc") {
    return { ...DEFAULT_HOSPITAL_REVIEW_COMMENT_SORT, enabled: false };
  }

  return { field, direction: "desc", enabled: true };
}

export function buildHospitalReviewCommentsQuery({
  searchKeyword,
  appliedFilters,
  sortState,
  page,
  categoryDomain,
}: {
  searchKeyword: string;
  appliedFilters: HospitalReviewFilters;
  sortState: HospitalReviewCommentSortState;
  page: number;
  categoryDomain: string;
}): HospitalReviewCommentsQuery {
  const query: HospitalReviewCommentsQuery = {
    category_domain: categoryDomain,
    sort: sortState.enabled ? sortState.field : DEFAULT_HOSPITAL_REVIEW_COMMENT_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_HOSPITAL_REVIEW_COMMENT_SORT.direction,
    per_page: HOSPITAL_REVIEWS_PER_PAGE,
    page,
  };

  const trimmedSearch = searchKeyword.trim();
  if (trimmedSearch) query.q = trimmedSearch;

  if (HOSPITAL_REVIEW_COMMENT_VISIBILITY_SET.has(appliedFilters.visibilityStatus) && appliedFilters.visibilityStatus) {
    query.status = appliedFilters.visibilityStatus;
  }

  const selectedCategoryId = appliedFilters.smallCategoryId
    || appliedFilters.middleCategoryId
    || appliedFilters.majorCategoryId
    || appliedFilters.categoryIds[0]
    || "";
  const categoryIds = [selectedCategoryId].filter((value) => /^[1-9]\d*$/.test(value));
  if (categoryIds.length > 0) query.category_ids = Array.from(new Set(categoryIds)).join(",");

  const metricMin = normalizeMetricBound(appliedFilters.metricMin);
  const metricMax = normalizeMetricBound(appliedFilters.metricMax);
  if (metricMin) query.metric_min = metricMin;
  if (metricMax) query.metric_max = metricMax;

  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;

  return query;
}

export function buildHospitalReviewCommentsQueryString(query: HospitalReviewCommentsQuery) {
  const params = new URLSearchParams();

  params.set("board", "comments");
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.category_ids) params.set("category_ids", query.category_ids);
  if (query.metric_min) params.set("metric_min", query.metric_min);
  if (query.metric_max) params.set("metric_max", query.metric_max);
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.sort !== DEFAULT_HOSPITAL_REVIEW_COMMENT_SORT.field) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_HOSPITAL_REVIEW_COMMENT_SORT.direction) params.set("direction", query.direction);
  if (query.page !== 1) params.set("page", String(query.page));

  return params.toString();
}

export function resetHospitalReviewCommentFilters(): HospitalReviewFilters {
  return {
    ...DEFAULT_HOSPITAL_REVIEW_FILTERS,
    metricField: "like_count",
  };
}
