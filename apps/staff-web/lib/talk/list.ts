import type { CheckboxFilterOption, DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

export type TalkAuthor = {
  id?: number | null;
  name?: string | null;
  nickname?: string | null;
  email?: string | null;
};

export type TalkCategory = {
  id?: number | null;
  name?: string | null;
  is_primary?: boolean | null;
};

export type TalkApiItem = {
  id: number;
  title?: string | null;
  content?: string | null;
  status?: string | null;
  post_status?: string | null;
  postStatus?: string | null;
  view_count?: number | null;
  viewCount?: number | null;
  comment_count?: number | null;
  commentCount?: number | null;
  like_count?: number | null;
  likeCount?: number | null;
  save_count?: number | null;
  saveCount?: number | null;
  created_at?: string | null;
  createdAt?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
  author?: TalkAuthor | null;
  categories?: TalkCategory[] | null;
};

export type TalkRow = {
  id: number;
  categoryNames: string[];
  title: string;
  contentPreview: string | null;
  status: string;
  postStatus: string;
  isVisible: boolean;
  visibilityChangeLocked: boolean;
  nickname: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  saveCount: number;
  updatedAt: string;
  createdAt: string;
};

export type SortField =
  | "id"
  | "title"
  | "status"
  | "post_status"
  | "view_count"
  | "comment_count"
  | "like_count"
  | "save_count"
  | "updated_at"
  | "created_at";
export type SortDirection = "asc" | "desc";

export type SortState = {
  field: SortField;
  direction: SortDirection;
  enabled: boolean;
};

export type Filters = {
  postStatuses: string[];
  categoryCodes: string[];
  visibilityStatus: string;
  metricField: TalkMetricField;
  metricMin: string;
  metricMax: string;
  dateRange: string;
  startDate: string;
  endDate: string;
};

export type TalkMetricField = "like_count" | "save_count" | "comment_count" | "view_count";

export type TalksQuery = {
  q?: string;
  status?: string;
  post_status?: string;
  category_codes?: string;
  metric?: TalkMetricField;
  metric_min?: string;
  metric_max?: string;
  start_date?: string;
  end_date?: string;
  include: string;
  sort: SortField;
  direction: SortDirection;
  per_page: number;
  page: number;
};

export const TALKS_PER_PAGE = 10;

export const TALK_POST_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "POST_NORMAL", label: "정상" },
  { value: "POST_AUTO_BLIND", label: "시스템차단" },
  { value: "POST_ADMIN_STOP", label: "게시중단" },
  { value: "POST_USER_DELETE", label: "본인삭제" },
];

export const TALK_CATEGORY_OPTIONS: CheckboxFilterOption[] = [
  { value: "TALK_PLASTIC_PETIT", label: "성형/쁘띠" },
  { value: "TALK_BEAUTY", label: "뷰티" },
  { value: "TALK_DAILY", label: "일상" },
  { value: "TALK_SECRET", label: "시크릿" },
];

export const TALK_VISIBILITY_OPTIONS = [
  { value: "", label: "전체" },
  { value: "ACTIVE", label: "노출" },
  { value: "INACTIVE", label: "미노출" },
];

export const TALK_METRIC_OPTIONS: { value: TalkMetricField; label: string }[] = [
  { value: "like_count", label: "좋아요수" },
  { value: "save_count", label: "저장횟수" },
  { value: "comment_count", label: "댓글수" },
  { value: "view_count", label: "조회수" },
];

export const DEFAULT_FILTERS: Filters = {
  postStatuses: [],
  categoryCodes: [],
  visibilityStatus: "",
  metricField: "like_count",
  metricMin: "",
  metricMax: "",
  dateRange: "",
  startDate: "",
  endDate: "",
};

export const DEFAULT_SORT: SortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

export const DATE_PRESET_OPTIONS = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "recent7", label: "최근 7일" },
  { key: "recent30", label: "최근 30일" },
] as const satisfies readonly DatePresetOption[];

export type DatePresetKey = (typeof DATE_PRESET_OPTIONS)[number]["key"];

const TALK_SORT_FIELDS = new Set<SortField>([
  "id",
  "title",
  "status",
  "post_status",
  "view_count",
  "comment_count",
  "like_count",
  "save_count",
  "updated_at",
  "created_at",
]);
const DEFAULT_INCLUDE_FIELDS = ["author", "categories"];
const TALK_POST_STATUS_VALUE_SET = new Set(TALK_POST_STATUS_OPTIONS.map((option) => option.value));
const TALK_CATEGORY_VALUE_SET = new Set(TALK_CATEGORY_OPTIONS.map((option) => option.value));
const TALK_VISIBILITY_VALUE_SET = new Set(TALK_VISIBILITY_OPTIONS.map((option) => option.value));
const TALK_METRIC_VALUE_SET = new Set<TalkMetricField>(TALK_METRIC_OPTIONS.map((option) => option.value));
const TALK_VISIBILITY_CHANGE_LOCKED_POST_STATUS_SET = new Set([
  "POST_AUTO_BLIND",
  "POST_ADMIN_STOP",
  "POST_USER_DELETE",
]);

export function labelTalkPostStatus(status: string) {
  if (status === "POST_NORMAL") return "정상";
  if (status === "POST_AUTO_BLIND") return "시스템차단";
  if (status === "POST_ADMIN_STOP") return "게시중단";
  if (status === "POST_USER_DELETE") return "본인삭제";
  return status;
}

export function isTalkVisibilityChangeLocked(postStatus: string | null | undefined) {
  return TALK_VISIBILITY_CHANGE_LOCKED_POST_STATUS_SET.has((postStatus ?? "").trim());
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

export function normalizeMetricBound(value: string | null | undefined) {
  const trimmedValue = (value ?? "").trim();
  if (!/^\d+$/.test(trimmedValue)) return "";

  return trimmedValue.replace(/^0+(?=\d)/, "");
}

export function buildTalkContentPreview(content: string | null | undefined, maxLength = 140): string | null {
  if (!content) return null;

  const normalized = content
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return null;
  if (normalized.length <= maxLength) return normalized;

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export function normalizeTalk(item: TalkApiItem): TalkRow {
  const sortedCategories = [...(item.categories ?? [])].sort(
    (left, right) => Number(Boolean(right?.is_primary)) - Number(Boolean(left?.is_primary)),
  );
  const categoryNames = sortedCategories
    .map((category) => category?.name?.trim() ?? "")
    .filter(Boolean);

  const createdAtRaw = item.createdAt ?? item.created_at ?? "";
  const updatedAtRaw = item.updatedAt ?? item.updated_at ?? "";
  const createdDate = createdAtRaw ? new Date(createdAtRaw) : null;
  const updatedDate = updatedAtRaw ? new Date(updatedAtRaw) : null;

  return {
    id: item.id,
    categoryNames,
    title: item.title?.trim() || "-",
    contentPreview: buildTalkContentPreview(item.content),
    status: item.status?.trim() || "ACTIVE",
    postStatus: item.postStatus?.trim() || item.post_status?.trim() || "POST_NORMAL",
    isVisible: (item.status?.trim() || "ACTIVE") === "ACTIVE",
    visibilityChangeLocked: isTalkVisibilityChangeLocked(item.postStatus ?? item.post_status),
    nickname: item.author?.nickname?.trim() || item.author?.name?.trim() || "-",
    viewCount: Number(item.viewCount ?? item.view_count ?? 0),
    commentCount: Number(item.commentCount ?? item.comment_count ?? 0),
    likeCount: Number(item.likeCount ?? item.like_count ?? 0),
    saveCount: Number(item.saveCount ?? item.save_count ?? 0),
    updatedAt: updatedDate && !Number.isNaN(updatedDate.getTime()) ? formatLocalDate(updatedDate) : "-",
    createdAt: createdDate && !Number.isNaN(createdDate.getTime()) ? formatLocalDate(createdDate) : "-",
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

export function parseTalksTableState(searchParams: URLSearchParams) {
  const categoryCodes = (searchParams.get("category_codes") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => TALK_CATEGORY_VALUE_SET.has(value));
  const postStatuses = (searchParams.get("post_status") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => TALK_POST_STATUS_VALUE_SET.has(value));
  const visibilityStatus = searchParams.get("status") ?? "";
  const metricParam = searchParams.get("metric");
  const metricField = metricParam && TALK_METRIC_VALUE_SET.has(metricParam as TalkMetricField)
    ? (metricParam as TalkMetricField)
    : DEFAULT_FILTERS.metricField;
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const createdDateState = buildFilterDateState(startDate, endDate);

  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const sortFieldParam = searchParams.get("sort");
  const sortDirectionParam = searchParams.get("direction");
  const sortField = sortFieldParam && TALK_SORT_FIELDS.has(sortFieldParam as SortField)
    ? (sortFieldParam as SortField)
    : DEFAULT_SORT.field;
  const sortDirection: SortDirection = sortDirectionParam === "asc" ? "asc" : "desc";

  return {
    searchKeyword: searchParams.get("q")?.trim() ?? "",
    filters: {
      postStatuses,
      categoryCodes,
      visibilityStatus: TALK_VISIBILITY_VALUE_SET.has(visibilityStatus) ? visibilityStatus : "",
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

export function buildTalksQuery({
  searchKeyword,
  appliedFilters,
  sortState,
  page,
}: {
  searchKeyword: string;
  appliedFilters: Filters;
  sortState: SortState;
  page: number;
}): TalksQuery {
  const query: TalksQuery = {
    include: DEFAULT_INCLUDE_FIELDS.join(","),
    sort: sortState.enabled ? sortState.field : DEFAULT_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_SORT.direction,
    per_page: TALKS_PER_PAGE,
    page,
  };

  const trimmedSearch = searchKeyword.trim();
  if (trimmedSearch) query.q = trimmedSearch;
  if (appliedFilters.visibilityStatus === "ACTIVE" || appliedFilters.visibilityStatus === "INACTIVE") {
    query.status = appliedFilters.visibilityStatus;
  }
  const normalizedPostStatuses = appliedFilters.postStatuses
    .map((value) => value.trim())
    .filter((value) => TALK_POST_STATUS_VALUE_SET.has(value));
  if (normalizedPostStatuses.length > 0) {
    query.post_status = Array.from(new Set(normalizedPostStatuses)).join(",");
  }
  const normalizedCategoryCodes = appliedFilters.categoryCodes
    .map((value) => value.trim())
    .filter((value) => TALK_CATEGORY_VALUE_SET.has(value));
  if (normalizedCategoryCodes.length > 0) {
    query.category_codes = Array.from(new Set(normalizedCategoryCodes)).join(",");
  }

  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;

  const metricMin = normalizeMetricBound(appliedFilters.metricMin);
  const metricMax = normalizeMetricBound(appliedFilters.metricMax);
  if ((metricMin || metricMax) && TALK_METRIC_VALUE_SET.has(appliedFilters.metricField)) {
    query.metric = appliedFilters.metricField;
    if (metricMin) query.metric_min = metricMin;
    if (metricMax) query.metric_max = metricMax;
  }

  return query;
}

export function buildTalksQueryString(query: TalksQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.post_status) params.set("post_status", query.post_status);
  if (query.category_codes) params.set("category_codes", query.category_codes);
  if (query.metric) params.set("metric", query.metric);
  if (query.metric_min) params.set("metric_min", query.metric_min);
  if (query.metric_max) params.set("metric_max", query.metric_max);
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.sort !== DEFAULT_SORT.field) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_SORT.direction) params.set("direction", query.direction);
  if (query.page !== 1) params.set("page", String(query.page));

  return params.toString();
}
