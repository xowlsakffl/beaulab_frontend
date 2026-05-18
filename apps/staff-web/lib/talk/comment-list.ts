import {
  TALK_VISIBILITY_OPTIONS,
  TALKS_PER_PAGE,
  buildTalkContentPreview,
  formatLocalDate,
  formatTalkCategoryName,
  normalizeMetricBound,
  type Filters,
  type SortDirection,
  type TalkAuthor,
  type TalkCategory,
} from "@/lib/talk/list";
import {
  formatVisibleReportStatusLabel,
  isVisibilityLockedByReport,
  normalizeReportStatus,
  VISIBILITY_LOCKING_REPORT_STATUS_VALUE_SET,
  type ContentReportSummary,
} from "@/lib/common/content-report";

export type TalkCommentApiItem = {
  id: number;
  created_at?: string | null;
  createdAt?: string | null;
  author?: TalkAuthor | null;
  category?: TalkCategory | null;
  mention?: TalkCommentMention | null;
  parent_talk_title?: string | null;
  parentTalkTitle?: string | null;
  content?: string | null;
  content_preview?: string | null;
  status?: string | null;
  like_count?: number | null;
  likeCount?: number | null;
  report?: ContentReportSummary | null;
};

export type TalkCommentMention = {
  id?: number | null;
  mentioned_user_id?: number | null;
  mentioned_by_user_id?: number | null;
  mentioned_user_name?: string | null;
  mention_text?: string | null;
};

export type TalkCommentRow = {
  id: number;
  createdAt: string;
  categoryName: string;
  nickname: string;
  mentionText: string | null;
  mentionedUserId: number | null;
  contentPreview: string | null;
  parentTalkTitle: string;
  status: string;
  isVisible: boolean;
  visibilityChangeLocked: boolean;
  reportStatus: string;
  reportStatusLabel: string;
  likeCount: number;
};

export type TalkCommentSortField =
  | "id"
  | "status"
  | "like_count"
  | "created_at";

export type TalkCommentSortState = {
  field: TalkCommentSortField;
  direction: SortDirection;
  enabled: boolean;
};

export type TalkCommentsQuery = {
  q?: string;
  status?: string;
  report_status?: string;
  category_ids?: string;
  metric_min?: string;
  metric_max?: string;
  start_date?: string;
  end_date?: string;
  sort: TalkCommentSortField;
  direction: SortDirection;
  per_page: number;
  page: number;
};

export const DEFAULT_TALK_COMMENT_SORT: TalkCommentSortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

const TALK_COMMENT_SORT_FIELDS = new Set<TalkCommentSortField>([
  "id",
  "status",
  "like_count",
  "created_at",
]);
const TALK_COMMENT_VISIBILITY_SET = new Set(TALK_VISIBILITY_OPTIONS.map((option) => option.value));

export function normalizeTalkComment(item: TalkCommentApiItem): TalkCommentRow {
  const createdAtRaw = item.createdAt ?? item.created_at ?? "";
  const createdDate = createdAtRaw ? new Date(createdAtRaw) : null;
  const categoryName = formatTalkCategoryName(item.category) || "-";
  const status = item.status?.trim() || "ACTIVE";

  return {
    id: item.id,
    createdAt: createdDate && !Number.isNaN(createdDate.getTime()) ? formatLocalDate(createdDate) : "-",
    categoryName,
    nickname: item.author?.nickname?.trim() || item.author?.name?.trim() || "-",
    mentionText: item.mention?.mention_text?.trim() || null,
    mentionedUserId: item.mention?.mentioned_user_id ? Number(item.mention.mentioned_user_id) : null,
    contentPreview: item.content_preview?.trim() || buildTalkContentPreview(item.content),
    parentTalkTitle: item.parentTalkTitle?.trim() || item.parent_talk_title?.trim() || "-",
    status,
    isVisible: status === "ACTIVE",
    visibilityChangeLocked: isVisibilityLockedByReport(item.report),
    reportStatus: normalizeReportStatus(item.report),
    reportStatusLabel: formatVisibleReportStatusLabel(item.report),
    likeCount: Number(item.likeCount ?? item.like_count ?? 0),
  };
}

export function parseTalkCommentSortState(searchParams: URLSearchParams): TalkCommentSortState {
  const sortFieldParam = searchParams.get("sort");
  const sortDirectionParam = searchParams.get("direction");
  const sortField = sortFieldParam && TALK_COMMENT_SORT_FIELDS.has(sortFieldParam as TalkCommentSortField)
    ? (sortFieldParam as TalkCommentSortField)
    : DEFAULT_TALK_COMMENT_SORT.field;
  const sortDirection: SortDirection = sortDirectionParam === "asc" ? "asc" : "desc";

  return {
    field: sortField,
    direction: sortDirection,
    enabled: Boolean(sortFieldParam || sortDirectionParam),
  };
}

export function nextTalkCommentSortState(
  prev: TalkCommentSortState,
  field: TalkCommentSortField,
): TalkCommentSortState {
  if (prev.field !== field) return { field, direction: "desc", enabled: true };
  if (prev.enabled && prev.direction === "desc") return { field, direction: "asc", enabled: true };
  if (prev.enabled && prev.direction === "asc") {
    return {
      field: DEFAULT_TALK_COMMENT_SORT.field,
      direction: DEFAULT_TALK_COMMENT_SORT.direction,
      enabled: false,
    };
  }

  return { field, direction: "desc", enabled: true };
}

export function buildTalkCommentsQuery({
  searchKeyword,
  appliedFilters,
  sortState,
  page,
}: {
  searchKeyword: string;
  appliedFilters: Filters;
  sortState: TalkCommentSortState;
  page: number;
}): TalkCommentsQuery {
  const query: TalkCommentsQuery = {
    sort: sortState.enabled ? sortState.field : DEFAULT_TALK_COMMENT_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_TALK_COMMENT_SORT.direction,
    per_page: TALKS_PER_PAGE,
    page,
  };

  const trimmedSearch = searchKeyword.trim();
  if (trimmedSearch) query.q = trimmedSearch;
  if (TALK_COMMENT_VISIBILITY_SET.has(appliedFilters.visibilityStatus) && appliedFilters.visibilityStatus) {
    query.status = appliedFilters.visibilityStatus;
  }
  if (VISIBILITY_LOCKING_REPORT_STATUS_VALUE_SET.has(appliedFilters.reportStatus)) {
    query.report_status = appliedFilters.reportStatus;
  }

  const normalizedCategoryIds = appliedFilters.categoryIds
    .map((value) => value.trim())
    .filter((value) => /^[1-9]\d*$/.test(value));
  if (normalizedCategoryIds.length > 0) {
    query.category_ids = Array.from(new Set(normalizedCategoryIds)).join(",");
  }

  const metricMin = normalizeMetricBound(appliedFilters.metricMin);
  const metricMax = normalizeMetricBound(appliedFilters.metricMax);
  if (metricMin) query.metric_min = metricMin;
  if (metricMax) query.metric_max = metricMax;

  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;

  return query;
}

export function buildTalkCommentsQueryString(query: TalkCommentsQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.report_status) params.set("report_status", query.report_status);
  if (query.category_ids) params.set("category_ids", query.category_ids);
  if (query.metric_min) params.set("metric_min", query.metric_min);
  if (query.metric_max) params.set("metric_max", query.metric_max);
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.sort !== DEFAULT_TALK_COMMENT_SORT.field) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_TALK_COMMENT_SORT.direction) params.set("direction", query.direction);
  if (query.page !== 1) params.set("page", String(query.page));

  return params.toString();
}
