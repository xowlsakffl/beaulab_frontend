import type { DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

import {
  formatVisibleReportStatusLabel,
  isVisibilityLockedByReport,
  normalizeReportStatus,
  VISIBILITY_LOCKING_REPORT_STATUS_FILTER_OPTIONS,
  VISIBILITY_LOCKING_REPORT_STATUS_VALUE_SET,
  type ContentReportSummary,
} from "@/lib/common/content-report";

export type TalkAuthor = {
  id?: number | null;
  name?: string | null;
  nickname?: string | null;
  email?: string | null;
};

export type TalkCategory = {
  id?: number | null;
  code?: string | null;
  domain?: string | null;
  name?: string | null;
  full_path?: string | null;
  is_primary?: boolean | null;
};

export type TalkApiItem = {
  id: number;
  title?: string | null;
  content?: string | null;
  content_preview?: string | null;
  status?: string | null;
  category?: TalkCategory | null;
  category_name?: string | null;
  categoryName?: string | null;
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
  report?: ContentReportSummary | null;
};

export type TalkRow = {
  id: number;
  categoryName: string;
  title: string;
  contentPreview: string | null;
  status: string;
  isVisible: boolean;
  visibilityChangeLocked: boolean;
  reportStatus: string;
  reportStatusLabel: string;
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
  categoryIds: string[];
  visibilityStatus: string;
  reportStatus: string;
  metricField: TalkMetricField;
  metricMin: string;
  metricMax: string;
  dateRange: string;
  startDate: string;
  endDate: string;
};

export type TalkMetricField = "" | "like_count" | "save_count" | "comment_count" | "view_count";

export type TalksQuery = {
  q?: string;
  status?: string;
  report_status?: string;
  category_ids?: string;
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

export const TALK_VISIBILITY_OPTIONS = [
  { value: "", label: "전체" },
  { value: "ACTIVE", label: "노출" },
  { value: "INACTIVE", label: "미노출" },
];

export const TALK_REPORT_STATUS_OPTIONS = VISIBILITY_LOCKING_REPORT_STATUS_FILTER_OPTIONS;

export const TALK_METRIC_OPTIONS: { value: TalkMetricField; label: string }[] = [
  { value: "", label: "선택" },
  { value: "like_count", label: "좋아요수" },
  { value: "save_count", label: "저장횟수" },
  { value: "comment_count", label: "댓글수" },
  { value: "view_count", label: "조회수" },
];

export const DEFAULT_FILTERS: Filters = {
  categoryIds: [],
  visibilityStatus: "",
  reportStatus: "",
  metricField: "",
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
  "view_count",
  "comment_count",
  "like_count",
  "save_count",
  "updated_at",
  "created_at",
]);
const DEFAULT_INCLUDE_FIELDS = ["author", "categories"];
const TALK_VISIBILITY_VALUE_SET = new Set(TALK_VISIBILITY_OPTIONS.map((option) => option.value));
const TALK_METRIC_VALUE_SET = new Set<TalkMetricField>(["like_count", "save_count", "comment_count", "view_count"]);

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

export function addMonthNoOverflow(date: Date) {
  const targetMonthIndex = date.getMonth() + 1;
  const targetYear = date.getFullYear() + Math.floor(targetMonthIndex / 12);
  const targetMonth = targetMonthIndex % 12;
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  return new Date(targetYear, targetMonth, Math.min(date.getDate(), lastDayOfTargetMonth));
}

export function isTalkExcelDateRangeAllowed(startDate: string, endDate: string) {
  const start = parseDateParam(startDate);
  const end = parseDateParam(endDate);

  if (!start || !end) return false;
  if (end < start) return false;

  return end <= addMonthNoOverflow(start);
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

export function formatTalkCategoryName(category?: TalkCategory | null) {
  const fullPath = category?.full_path?.trim();
  if (fullPath) return fullPath;

  const name = category?.name?.trim();
  if (name) return name;

  return "";
}

function normalizePositiveIdListParam(value: string | null) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => /^[1-9]\d*$/.test(item));
}

export function normalizeTalk(item: TalkApiItem): TalkRow {
  const categoryName = formatTalkCategoryName(item.category)
    || item.categoryName?.trim()
    || item.category_name?.trim()
    || "-";

  const createdAtRaw = item.createdAt ?? item.created_at ?? "";
  const updatedAtRaw = item.updatedAt ?? item.updated_at ?? "";
  const createdDate = createdAtRaw ? new Date(createdAtRaw) : null;
  const updatedDate = updatedAtRaw ? new Date(updatedAtRaw) : null;

  return {
    id: item.id,
    categoryName,
    title: item.title?.trim() || "-",
    contentPreview: buildTalkContentPreview(item.content_preview ?? item.content),
    status: item.status?.trim() || "ACTIVE",
    isVisible: (item.status?.trim() || "ACTIVE") === "ACTIVE",
    visibilityChangeLocked: isVisibilityLockedByReport(item.report),
    reportStatus: normalizeReportStatus(item.report),
    reportStatusLabel: formatVisibleReportStatusLabel(item.report),
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
  const categoryIds = normalizePositiveIdListParam(
    searchParams.get("category_ids") ?? searchParams.get("category_id"),
  );
  const visibilityStatus = searchParams.get("status") ?? "";
  const reportStatus = searchParams.get("report_status") ?? "";
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
      categoryIds,
      visibilityStatus: TALK_VISIBILITY_VALUE_SET.has(visibilityStatus) ? visibilityStatus : "",
      reportStatus: VISIBILITY_LOCKING_REPORT_STATUS_VALUE_SET.has(reportStatus) ? reportStatus : "",
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
  if (VISIBILITY_LOCKING_REPORT_STATUS_VALUE_SET.has(appliedFilters.reportStatus)) {
    query.report_status = appliedFilters.reportStatus;
  }
  const normalizedCategoryIds = appliedFilters.categoryIds
    .map((value) => value.trim())
    .filter((value) => /^[1-9]\d*$/.test(value));
  if (normalizedCategoryIds.length > 0) {
    query.category_ids = Array.from(new Set(normalizedCategoryIds)).join(",");
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
  return buildTalksQuerySearchParams(query, { includePage: true }).toString();
}

export function buildTalksExcelDownloadPath(query: TalksQuery) {
  const queryString = buildTalksQuerySearchParams(query, { includePage: false }).toString();

  return queryString ? `/talks/excel-download?${queryString}` : "/talks/excel-download";
}

function buildTalksQuerySearchParams(query: TalksQuery, { includePage }: { includePage: boolean }) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.report_status) params.set("report_status", query.report_status);
  if (query.category_ids) params.set("category_ids", query.category_ids);
  if (query.metric) params.set("metric", query.metric);
  if (query.metric_min) params.set("metric_min", query.metric_min);
  if (query.metric_max) params.set("metric_max", query.metric_max);
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.sort !== DEFAULT_SORT.field) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_SORT.direction) params.set("direction", query.direction);
  if (includePage && query.page !== 1) params.set("page", String(query.page));

  return params;
}
