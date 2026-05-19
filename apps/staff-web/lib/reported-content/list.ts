import type { DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

import {
  formatHospitalReviewCategories,
  formatHospitalReviewDate,
  formatHospitalReviewAuthorName,
  resolveHospitalReviewMediaUrl,
  type HospitalReviewApiItem,
  type HospitalReviewMediaAsset,
} from "@/lib/hospital-review/list";
import {
  buildHospitalReviewCommentContentPreview,
  type HospitalReviewCommentApiItem,
} from "@/lib/hospital-review/comment-list";
import {
  formatHospitalEvaluationAuthorName,
  formatHospitalEvaluationDate,
  labelHospitalEvaluationReviewType,
  type HospitalEvaluationApiItem,
} from "@/lib/hospital-evaluation/list";
import {
  type TalkCommentApiItem,
} from "@/lib/talk/comment-list";
import {
  buildTalkContentPreview,
  formatDateRange,
  formatLocalDate,
  normalizeRangeDate,
  type TalkApiItem,
} from "@/lib/talk/list";

export type ReportedContentBoardType = "surgery-reviews" | "treatment-reviews" | "hospital-evaluations" | "talks" | "chats";
export type ReportedContentKind = "review" | "review-comment" | "evaluation" | "talk" | "talk-comment" | "chat";
export type ReportedContentBoardMode = "posts" | "comments";
export type ReportedContentDateType = "created_at" | "first_reported_at" | "last_message_at";
export type ReportedContentSearchType = "id" | "nickname" | "hospital_name" | "content";
export type ReportedContentOption<T extends string = string> = {
  value: T;
  label: string;
};

export type ReportedContentBoardConfig = {
  type: ReportedContentBoardType;
  kind: ReportedContentKind;
  commentKind?: ReportedContentKind;
  title: string;
  listPath: string;
  apiPath: string;
  commentApiPath?: string;
  detailPath: (id: number) => string;
  commentDetailPath?: (id: number) => string;
  dateTypeOptions?: ReportedContentOption<ReportedContentDateType>[];
  statusOptions?: ReportedContentOption[];
  defaultDateType?: ReportedContentDateType;
  searchInputPlaceholder?: string;
  statusLabel?: string;
  dateTypeInline?: boolean;
  showVisibilityFilter?: boolean;
  showWarningFilter?: boolean;
  showSummaryCards?: boolean;
};

export type ReportedContentReasonCount = {
  reason?: string | null;
  label?: string | null;
  count?: number | null;
};

export type ReportedContentLatestReport = {
  id?: number | null;
  reason?: string | null;
  reason_label?: string | null;
  reason_text?: string | null;
  reporter?: {
    id?: number | null;
    name?: string | null;
    nickname?: string | null;
    email?: string | null;
  } | null;
  created_at?: string | null;
};

export type ReportedContentReport = {
  status?: string | null;
  label?: string | null;
  report_count?: number | null;
  recent_hour_report_count?: number | null;
  normal_visible_count?: number | null;
  is_auto_action_locked?: boolean | null;
  first_reported_at?: string | null;
  last_reported_at?: string | null;
  auto_blocked_at?: string | null;
  admin_hidden_at?: string | null;
  normal_visible_at?: string | null;
  latest_report?: ReportedContentLatestReport | null;
  reason_counts?: ReportedContentReasonCount[] | null;
  warning_status?: string | null;
  warning_label?: string | null;
  warning?: boolean | null;
  warning_ignored?: boolean | null;
};

export type ReportedContentApiItem = {
  target_type?: string | null;
  target?: HospitalReviewApiItem | HospitalReviewCommentApiItem | HospitalEvaluationApiItem | TalkApiItem | TalkCommentApiItem | ReportedChatMessageApiItem | null;
  report?: ReportedContentReport | null;
};

export type ReportedChatMessageApiItem = {
  id?: number | null;
  chat_id?: number | null;
  created_at?: string | null;
  last_message_at?: string | null;
  sender?: {
    id?: number | null;
    name?: string | null;
    nickname?: string | null;
    email?: string | null;
  } | null;
  body?: string | null;
  body_preview?: string | null;
  message_type?: string | null;
};

export type ReportedContentSummary = {
  reported_or_auto_blocked_count?: number | null;
  today_report_count?: number | null;
  recent_30_days_admin_hidden_count?: number | null;
  recent_30_days_normal_visible_count?: number | null;
};

export type ReportedContentRow = {
  id: number;
  chatRoomId: number | null;
  createdAt: string;
  categoryLabel: string;
  image: HospitalReviewMediaAsset | null;
  imageCount: number;
  nickname: string;
  title: string;
  content: string;
  parentTitle: string;
  hospitalName: string;
  phone: string;
  reporterNickname: string;
  reportReason: string;
  reportCount: number;
  firstReportedAt: string;
  status: string;
  statusLabel: string;
  isVisible: boolean;
  visibilityLabel: string;
  hasWarning: boolean;
  hasIgnoredWarning: boolean;
  detailPath: string;
};

export type ReportedContentFilters = {
  dateType: ReportedContentDateType;
  searchType: ReportedContentSearchType;
  dateRange: string;
  startDate: string;
  endDate: string;
  reportReason: string;
  reportCountMin: string;
  reportCountMax: string;
  visibilityStatus: string;
  reportStatus: string;
  warningStatus: string;
};

export type ReportedContentQuery = {
  q?: string;
  search_type?: ReportedContentSearchType;
  date_type?: ReportedContentDateType;
  start_date?: string;
  end_date?: string;
  report_reason?: string;
  report_count_min?: string;
  report_count_max?: string;
  target_status?: string;
  report_status?: string;
  warning_status?: string;
  sort: ReportedContentSortField;
  direction: ReportedContentSortDirection;
  per_page: number;
  page: number;
};

export type ReportedContentSortField =
  | "target_id"
  | "report_status"
  | "report_count"
  | "recent_hour_report_count"
  | "first_reported_at"
  | "last_reported_at"
  | "updated_at";
export type ReportedContentSortDirection = "asc" | "desc";

export type ReportedContentSortState = {
  field: ReportedContentSortField;
  direction: ReportedContentSortDirection;
  enabled: boolean;
};

export const REPORTED_CONTENT_PER_PAGE = 15;

export const REPORTED_CONTENT_BOARD_CONFIGS: Record<ReportedContentBoardType, ReportedContentBoardConfig> = {
  "surgery-reviews": {
    type: "surgery-reviews",
    kind: "review",
    commentKind: "review-comment",
    title: "성형후기",
    listPath: "/reported-content/surgery-reviews",
    apiPath: "/reported-contents/hospital-reviews/surgery",
    commentApiPath: "/reported-contents/hospital-review-comments/surgery",
    detailPath: (id) => `/reported-content/surgery-reviews/${id}`,
    commentDetailPath: (id) => `/reported-content/surgery-reviews/comments/${id}`,
  },
  "treatment-reviews": {
    type: "treatment-reviews",
    kind: "review",
    commentKind: "review-comment",
    title: "시술후기",
    listPath: "/reported-content/treatment-reviews",
    apiPath: "/reported-contents/hospital-reviews/treatment",
    commentApiPath: "/reported-contents/hospital-review-comments/treatment",
    detailPath: (id) => `/reported-content/treatment-reviews/${id}`,
    commentDetailPath: (id) => `/reported-content/treatment-reviews/comments/${id}`,
  },
  "hospital-evaluations": {
    type: "hospital-evaluations",
    kind: "evaluation",
    title: "병의원 평가",
    listPath: "/reported-content/hospital-evaluations",
    apiPath: "/reported-contents/hospital-evaluations",
    detailPath: (id) => `/reported-content/hospital-evaluations/${id}`,
  },
  talks: {
    type: "talks",
    kind: "talk",
    commentKind: "talk-comment",
    title: "토크",
    listPath: "/reported-content/talks",
    apiPath: "/reported-contents/talks",
    commentApiPath: "/reported-contents/talk-comments",
    detailPath: (id) => `/reported-content/talks/${id}`,
    commentDetailPath: (id) => `/reported-content/talks/comments/${id}`,
  },
  chats: {
    type: "chats",
    kind: "chat",
    title: "채팅",
    listPath: "/reported-content/chats",
    apiPath: "/reported-contents/chats",
    detailPath: (id) => `/reported-content/chats/${id}`,
    dateTypeOptions: [
      { value: "last_message_at", label: "대화일" },
      { value: "first_reported_at", label: "신고일" },
    ],
    statusOptions: [
      { value: "", label: "전체" },
      { value: "REPORTED", label: "신고접수" },
      { value: "VALID", label: "적합" },
      { value: "INVALID", label: "부적합" },
    ],
    defaultDateType: "last_message_at",
    searchInputPlaceholder: "채팅방ID, 작성자 닉네임, 채팅 내용을 입력해주세요",
    statusLabel: "적합여부",
    dateTypeInline: true,
    showVisibilityFilter: false,
    showWarningFilter: false,
    showSummaryCards: false,
  },
};

export const DEFAULT_REPORTED_CONTENT_FILTERS: ReportedContentFilters = {
  dateType: "first_reported_at",
  searchType: "nickname",
  dateRange: "",
  startDate: "",
  endDate: "",
  reportReason: "",
  reportCountMin: "",
  reportCountMax: "",
  visibilityStatus: "",
  reportStatus: "",
  warningStatus: "",
};

export const DEFAULT_REPORTED_CONTENT_SORT: ReportedContentSortState = {
  field: "first_reported_at",
  direction: "desc",
  enabled: true,
};

export const REPORTED_CONTENT_DATE_TYPE_OPTIONS: ReportedContentOption<ReportedContentDateType>[] = [
  { value: "created_at", label: "등록일" },
  { value: "first_reported_at", label: "최초신고일" },
];

export const REPORTED_CONTENT_SEARCH_TYPE_OPTIONS: ReportedContentOption<ReportedContentSearchType>[] = [
  { value: "id", label: "ID" },
  { value: "nickname", label: "닉네임" },
  { value: "hospital_name", label: "병의원명" },
  { value: "content", label: "내용" },
];

export const REPORTED_CONTENT_REASON_OPTIONS = [
  { value: "", label: "전체" },
  { value: "ABUSE", label: "비방/욕설" },
  { value: "SPAM", label: "게시물/댓글 도배" },
  { value: "ILLEGAL_AD", label: "불법광고/홍보" },
  { value: "PRIVACY_COPYRIGHT", label: "개인정보/저작권 침해" },
  { value: "OTHER", label: "기타" },
];

export const REPORTED_CONTENT_VISIBILITY_OPTIONS = [
  { value: "", label: "전체" },
  { value: "ACTIVE", label: "노출" },
  { value: "INACTIVE", label: "미노출" },
];

export const REPORTED_CONTENT_STATUS_OPTIONS: ReportedContentOption[] = [
  { value: "", label: "전체" },
  { value: "REPORTED", label: "신고접수" },
  { value: "AUTO_BLOCKED", label: "자동차단" },
  { value: "ADMIN_HIDDEN", label: "노출중지" },
  { value: "NORMAL_VISIBLE", label: "정상노출" },
  { value: "REEXPOSED", label: "재노출" },
];

export const REPORTED_CONTENT_WARNING_OPTIONS = [
  { value: "", label: "전체" },
  { value: "WARNED", label: "경고" },
  { value: "IGNORED", label: "무시" },
  { value: "NONE", label: "미처리" },
];

export const REPORTED_CONTENT_DATE_PRESET_OPTIONS = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "recent7", label: "최근 7일" },
  { key: "recent30", label: "최근 30일" },
] as const satisfies readonly DatePresetOption[];

export type ReportedContentDatePresetKey = (typeof REPORTED_CONTENT_DATE_PRESET_OPTIONS)[number]["key"];

const REPORTED_CONTENT_SORT_FIELDS = new Set<ReportedContentSortField>([
  "target_id",
  "report_status",
  "report_count",
  "recent_hour_report_count",
  "first_reported_at",
  "last_reported_at",
  "updated_at",
]);
const REPORTED_CONTENT_REASON_SET = new Set(REPORTED_CONTENT_REASON_OPTIONS.map((option) => option.value));
const REPORTED_CONTENT_VISIBILITY_SET = new Set(REPORTED_CONTENT_VISIBILITY_OPTIONS.map((option) => option.value));
const REPORTED_CONTENT_WARNING_SET = new Set(REPORTED_CONTENT_WARNING_OPTIONS.map((option) => option.value));

export function defaultReportedContentFilters(config?: ReportedContentBoardConfig): ReportedContentFilters {
  return {
    ...DEFAULT_REPORTED_CONTENT_FILTERS,
    dateType: config?.defaultDateType ?? DEFAULT_REPORTED_CONTENT_FILTERS.dateType,
  };
}

export function reportedContentDateTypeOptions(config?: ReportedContentBoardConfig) {
  return config?.dateTypeOptions ?? REPORTED_CONTENT_DATE_TYPE_OPTIONS;
}

export function reportedContentStatusOptions(config?: ReportedContentBoardConfig) {
  return config?.statusOptions ?? REPORTED_CONTENT_STATUS_OPTIONS;
}

export function buildReportedContentPresetDateRange(preset: ReportedContentDatePresetKey): DateRange {
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

export function mapDateRangeToReportedContentFilter(range?: DateRange) {
  return {
    label: formatDateRange(range),
    startDate: range?.from ? formatLocalDate(range.from) : "",
    endDate: range?.to ? formatLocalDate(range.to) : "",
  };
}

export function parseReportedContentTableState(searchParams: URLSearchParams, config?: ReportedContentBoardConfig) {
  const defaultFilters = defaultReportedContentFilters(config);
  const dateTypeSet = new Set<string>(reportedContentDateTypeOptions(config).map((option) => option.value));
  const statusSet = new Set<string>(reportedContentStatusOptions(config).map((option) => option.value));
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const dateRange = buildReportedContentDateState(startDate, endDate);
  const dateTypeParam = searchParams.get("date_type") ?? defaultFilters.dateType;
  const reportReason = searchParams.get("report_reason") ?? "";
  const visibilityStatus = searchParams.get("target_status") ?? "";
  const reportStatus = searchParams.get("report_status") ?? "";
  const warningStatus = searchParams.get("warning_status") ?? searchParams.get("warning") ?? "";
  const sortFieldParam = searchParams.get("sort");
  const sortDirectionParam = searchParams.get("direction");
  const sortField = sortFieldParam && REPORTED_CONTENT_SORT_FIELDS.has(sortFieldParam as ReportedContentSortField)
    ? (sortFieldParam as ReportedContentSortField)
    : DEFAULT_REPORTED_CONTENT_SORT.field;
  const sortDirection: ReportedContentSortDirection = sortDirectionParam === "asc" ? "asc" : "desc";
  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return {
    searchKeyword: searchParams.get("q")?.trim() ?? "",
    filters: {
      dateType: dateTypeSet.has(dateTypeParam)
        ? (dateTypeParam as ReportedContentDateType)
        : defaultFilters.dateType,
      searchType: defaultFilters.searchType,
      dateRange: dateRange.label,
      startDate,
      endDate,
      reportReason: REPORTED_CONTENT_REASON_SET.has(reportReason) ? reportReason : "",
      reportCountMin: normalizeNumberBound(searchParams.get("report_count_min")),
      reportCountMax: normalizeNumberBound(searchParams.get("report_count_max")),
      visibilityStatus: REPORTED_CONTENT_VISIBILITY_SET.has(visibilityStatus) ? visibilityStatus : "",
      reportStatus: statusSet.has(reportStatus) ? reportStatus : "",
      warningStatus: REPORTED_CONTENT_WARNING_SET.has(warningStatus) ? warningStatus : "",
    },
    draftDateRange: dateRange.range,
    sortState: {
      field: sortField,
      direction: sortDirection,
      enabled: Boolean(sortFieldParam || sortDirectionParam),
    },
    page,
  };
}

export function buildReportedContentQuery({
  searchKeyword,
  appliedFilters,
  sortState,
  page,
}: {
  searchKeyword: string;
  appliedFilters: ReportedContentFilters;
  sortState: ReportedContentSortState;
  page: number;
}): ReportedContentQuery {
  const query: ReportedContentQuery = {
    sort: sortState.enabled ? sortState.field : DEFAULT_REPORTED_CONTENT_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_REPORTED_CONTENT_SORT.direction,
    per_page: REPORTED_CONTENT_PER_PAGE,
    page,
  };

  const trimmedSearch = searchKeyword.trim();
  if (trimmedSearch) {
    query.q = trimmedSearch;
  }
  if (appliedFilters.dateType) query.date_type = appliedFilters.dateType;
  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;
  if (appliedFilters.reportReason) query.report_reason = appliedFilters.reportReason;
  if (appliedFilters.reportCountMin) query.report_count_min = normalizeNumberBound(appliedFilters.reportCountMin);
  if (appliedFilters.reportCountMax) query.report_count_max = normalizeNumberBound(appliedFilters.reportCountMax);
  if (appliedFilters.visibilityStatus) query.target_status = appliedFilters.visibilityStatus;
  if (appliedFilters.reportStatus) query.report_status = appliedFilters.reportStatus;
  if (appliedFilters.warningStatus) query.warning_status = appliedFilters.warningStatus;

  return query;
}

export function buildReportedContentQueryString(query: ReportedContentQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.date_type && query.date_type !== DEFAULT_REPORTED_CONTENT_FILTERS.dateType) params.set("date_type", query.date_type);
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.report_reason) params.set("report_reason", query.report_reason);
  if (query.report_count_min) params.set("report_count_min", query.report_count_min);
  if (query.report_count_max) params.set("report_count_max", query.report_count_max);
  if (query.target_status) params.set("target_status", query.target_status);
  if (query.report_status) params.set("report_status", query.report_status);
  if (query.warning_status) params.set("warning_status", query.warning_status);
  if (query.sort !== DEFAULT_REPORTED_CONTENT_SORT.field) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_REPORTED_CONTENT_SORT.direction) params.set("direction", query.direction);
  if (query.page !== 1) params.set("page", String(query.page));

  return params.toString();
}

export function nextReportedContentSortState(
  prev: ReportedContentSortState,
  field: ReportedContentSortField,
): ReportedContentSortState {
  if (prev.field !== field) return { field, direction: "desc", enabled: true };
  if (prev.enabled && prev.direction === "desc") return { field, direction: "asc", enabled: true };
  if (prev.enabled && prev.direction === "asc") return { ...DEFAULT_REPORTED_CONTENT_SORT, enabled: false };

  return { field, direction: "desc", enabled: true };
}

export function normalizeReportedContent(
  item: ReportedContentApiItem,
  config: ReportedContentBoardConfig,
  kind: ReportedContentKind = config.kind,
): ReportedContentRow {
  if (kind === "review") {
    return normalizeReportedReview(item.target as HospitalReviewApiItem | null | undefined, item.report, config);
  }

  if (kind === "review-comment") {
    return normalizeReportedReviewComment(item.target as HospitalReviewCommentApiItem | null | undefined, item.report, config);
  }

  if (kind === "evaluation") {
    return normalizeReportedEvaluation(item.target as HospitalEvaluationApiItem | null | undefined, item.report, config);
  }

  if (kind === "talk-comment") {
    return normalizeReportedTalkComment(item.target as TalkCommentApiItem | null | undefined, item.report, config);
  }

  if (kind === "chat") {
    return normalizeReportedChatMessage(item.target as ReportedChatMessageApiItem | null | undefined, item.report, config);
  }

  return normalizeReportedTalk(item.target as TalkApiItem | null | undefined, item.report, config);
}

export function resolveReportedReviewImageUrl(media?: HospitalReviewMediaAsset | null) {
  return resolveHospitalReviewMediaUrl(media);
}

function normalizeReportedReview(
  target: HospitalReviewApiItem | null | undefined,
  report: ReportedContentReport | null | undefined,
  config: ReportedContentBoardConfig,
): ReportedContentRow {
  const beforeImages = target?.before_images ?? [];
  const afterImages = target?.after_images ?? [];
  const imageCount = Number(target?.image_count ?? beforeImages.length + afterImages.length);
  const status = target?.status?.trim() || "ACTIVE";
  const id = Number(target?.id ?? 0);

  return {
    id,
    chatRoomId: null,
    createdAt: formatHospitalReviewDate(target?.created_at),
    categoryLabel: formatHospitalReviewCategories(target?.categories),
    image: target?.first_image ?? beforeImages[0] ?? afterImages[0] ?? null,
    imageCount,
    nickname: formatHospitalReviewAuthorName(target?.author),
    title: "",
    content: "",
    parentTitle: "",
    hospitalName: target?.hospital?.name?.trim() || "-",
    phone: "-",
    reporterNickname: latestReporterNickname(report),
    reportReason: dominantReportReason(report),
    reportCount: Number(report?.report_count ?? 0),
    firstReportedAt: formatReportedDate(report?.first_reported_at ?? report?.last_reported_at),
    status: report?.status?.trim() || "REPORTED",
    statusLabel: report?.label?.trim() || labelReportStatus(report?.status),
    isVisible: status === "ACTIVE",
    visibilityLabel: labelVisibility(status),
    hasWarning: Boolean(report?.warning),
    hasIgnoredWarning: Boolean(report?.warning_ignored),
    detailPath: config.detailPath(id),
  };
}

function normalizeReportedReviewComment(
  target: HospitalReviewCommentApiItem | null | undefined,
  report: ReportedContentReport | null | undefined,
  config: ReportedContentBoardConfig,
): ReportedContentRow {
  const status = target?.status?.trim() || "ACTIVE";
  const id = Number(target?.id ?? 0);
  const beforeImages = target?.parent?.before_images ?? [];
  const afterImages = target?.parent?.after_images ?? [];
  const imageCount = Number(target?.parent?.image_count ?? beforeImages.length + afterImages.length);
  const categories = Array.isArray(target?.categories) && target.categories.length > 0
    ? target.categories
    : target?.parent?.categories ?? [];

  return {
    id,
    chatRoomId: null,
    createdAt: formatHospitalReviewDate(target?.created_at),
    categoryLabel: formatHospitalReviewCategories(categories, 3),
    image: target?.parent?.first_image ?? beforeImages[0] ?? afterImages[0] ?? null,
    imageCount,
    nickname: formatHospitalReviewAuthorName(target?.author),
    title: target?.parent?.title?.trim() || "-",
    content: target?.content_preview?.trim() || buildHospitalReviewCommentContentPreview(target?.content),
    parentTitle: target?.parent?.title?.trim() || "-",
    hospitalName: "-",
    phone: "-",
    reporterNickname: latestReporterNickname(report),
    reportReason: dominantReportReason(report),
    reportCount: Number(report?.report_count ?? 0),
    firstReportedAt: formatReportedDate(report?.first_reported_at ?? report?.last_reported_at),
    status: report?.status?.trim() || "REPORTED",
    statusLabel: report?.label?.trim() || labelReportStatus(report?.status),
    isVisible: status === "ACTIVE",
    visibilityLabel: labelVisibility(status),
    hasWarning: Boolean(report?.warning),
    hasIgnoredWarning: Boolean(report?.warning_ignored),
    detailPath: config.commentDetailPath?.(id) ?? "",
  };
}

function normalizeReportedEvaluation(
  target: HospitalEvaluationApiItem | null | undefined,
  report: ReportedContentReport | null | undefined,
  config: ReportedContentBoardConfig,
): ReportedContentRow {
  const status = target?.status?.trim() || "ACTIVE";
  const id = Number(target?.id ?? 0);

  return {
    id,
    chatRoomId: null,
    createdAt: formatHospitalEvaluationDate(target?.created_at),
    categoryLabel: labelHospitalEvaluationReviewType(target?.category_domain),
    image: null,
    imageCount: 0,
    nickname: formatHospitalEvaluationAuthorName(target?.author),
    title: "",
    content: "",
    parentTitle: "",
    hospitalName: target?.hospital?.name?.trim() || "-",
    phone: target?.phone?.trim() || "-",
    reporterNickname: latestReporterNickname(report),
    reportReason: dominantReportReason(report),
    reportCount: Number(report?.report_count ?? 0),
    firstReportedAt: formatReportedDate(report?.first_reported_at ?? report?.last_reported_at),
    status: report?.status?.trim() || "REPORTED",
    statusLabel: report?.label?.trim() || labelReportStatus(report?.status),
    isVisible: status === "ACTIVE",
    visibilityLabel: labelVisibility(status),
    hasWarning: Boolean(report?.warning),
    hasIgnoredWarning: Boolean(report?.warning_ignored),
    detailPath: config.detailPath(id),
  };
}

function normalizeReportedTalk(
  target: TalkApiItem | null | undefined,
  report: ReportedContentReport | null | undefined,
  config: ReportedContentBoardConfig,
): ReportedContentRow {
  const status = target?.status?.trim() || "ACTIVE";
  const id = Number(target?.id ?? 0);

  return {
    id,
    chatRoomId: null,
    createdAt: formatTalkDate(target?.created_at ?? target?.createdAt),
    categoryLabel: target?.category?.name?.trim() || target?.category_name?.trim() || target?.categoryName?.trim() || "-",
    image: null,
    imageCount: 0,
    nickname: target?.author?.nickname?.trim() || target?.author?.name?.trim() || "-",
    title: target?.title?.trim() || "-",
    content: "",
    parentTitle: "",
    hospitalName: "-",
    phone: "-",
    reporterNickname: latestReporterNickname(report),
    reportReason: dominantReportReason(report),
    reportCount: Number(report?.report_count ?? 0),
    firstReportedAt: formatReportedDate(report?.first_reported_at ?? report?.last_reported_at),
    status: report?.status?.trim() || "REPORTED",
    statusLabel: report?.label?.trim() || labelReportStatus(report?.status),
    isVisible: status === "ACTIVE",
    visibilityLabel: labelVisibility(status),
    hasWarning: Boolean(report?.warning),
    hasIgnoredWarning: Boolean(report?.warning_ignored),
    detailPath: config.detailPath(id),
  };
}

function normalizeReportedTalkComment(
  target: TalkCommentApiItem | null | undefined,
  report: ReportedContentReport | null | undefined,
  config: ReportedContentBoardConfig,
): ReportedContentRow {
  const status = target?.status?.trim() || "ACTIVE";
  const id = Number(target?.id ?? 0);

  return {
    id,
    chatRoomId: null,
    createdAt: formatTalkDate(target?.created_at ?? target?.createdAt),
    categoryLabel: target?.category?.name?.trim() || target?.category?.full_path?.trim() || "-",
    image: null,
    imageCount: 0,
    nickname: target?.author?.nickname?.trim() || target?.author?.name?.trim() || "-",
    title: target?.parentTalkTitle?.trim() || target?.parent_talk_title?.trim() || "-",
    content: target?.content_preview?.trim() || buildTalkContentPreview(target?.content) || "-",
    parentTitle: target?.parentTalkTitle?.trim() || target?.parent_talk_title?.trim() || "-",
    hospitalName: "-",
    phone: "-",
    reporterNickname: latestReporterNickname(report),
    reportReason: dominantReportReason(report),
    reportCount: Number(report?.report_count ?? 0),
    firstReportedAt: formatReportedDate(report?.first_reported_at ?? report?.last_reported_at),
    status: report?.status?.trim() || "REPORTED",
    statusLabel: report?.label?.trim() || labelReportStatus(report?.status),
    isVisible: status === "ACTIVE",
    visibilityLabel: labelVisibility(status),
    hasWarning: Boolean(report?.warning),
    hasIgnoredWarning: Boolean(report?.warning_ignored),
    detailPath: config.commentDetailPath?.(id) ?? "",
  };
}

function normalizeReportedChatMessage(
  target: ReportedChatMessageApiItem | null | undefined,
  report: ReportedContentReport | null | undefined,
  config: ReportedContentBoardConfig,
): ReportedContentRow {
  const id = Number(target?.id ?? 0);
  const chatRoomId = Number(target?.chat_id ?? 0) || null;

  return {
    id,
    chatRoomId,
    createdAt: formatReportedDate(target?.last_message_at ?? target?.created_at),
    categoryLabel: "-",
    image: null,
    imageCount: 0,
    nickname: target?.sender?.nickname?.trim() || target?.sender?.name?.trim() || "-",
    title: "",
    content: target?.body_preview?.trim() || target?.body?.trim() || "-",
    parentTitle: "",
    hospitalName: "-",
    phone: "-",
    reporterNickname: latestReporterNickname(report),
    reportReason: dominantReportReason(report),
    reportCount: Number(report?.report_count ?? 0),
    firstReportedAt: formatReportedDate(report?.latest_report?.created_at ?? report?.last_reported_at ?? report?.first_reported_at),
    status: report?.status?.trim() || "REPORTED",
    statusLabel: labelChatReportStatus(report?.status),
    isVisible: false,
    visibilityLabel: "-",
    hasWarning: Boolean(report?.warning),
    hasIgnoredWarning: Boolean(report?.warning_ignored),
    detailPath: config.detailPath(id),
  };
}

function dominantReportReason(report?: ReportedContentReport | null) {
  const reason = report?.reason_counts?.[0]?.label?.trim()
    || report?.latest_report?.reason_label?.trim()
    || report?.latest_report?.reason?.trim();

  return reason || "-";
}

function latestReporterNickname(report?: ReportedContentReport | null) {
  const reporter = report?.latest_report?.reporter;

  return reporter?.nickname?.trim() || reporter?.name?.trim() || "-";
}

function labelChatReportStatus(status?: string | null) {
  if (status === "VALID" || status === "ADMIN_HIDDEN") return "적합";
  if (status === "INVALID" || status === "NORMAL_VISIBLE") return "부적합";

  return "신고접수";
}

function labelReportStatus(status?: string | null) {
  return REPORTED_CONTENT_STATUS_OPTIONS.find((option) => option.value === status)?.label || "신고접수";
}

function labelVisibility(status?: string | null) {
  return status === "INACTIVE" ? "미노출" : "노출";
}

function formatReportedDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return formatLocalDate(date);
}

function formatTalkDate(value?: string | null) {
  return formatReportedDate(value);
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

function buildReportedContentDateState(startDate: string, endDate: string) {
  const from = startDate ? parseDateParam(startDate) : undefined;
  const to = endDate ? parseDateParam(endDate) : undefined;
  const range = from || to ? { from: from ?? to, to: to ?? from } : undefined;

  return {
    range,
    label: formatDateRange(range),
  };
}

function normalizeNumberBound(value: string | null | undefined) {
  const trimmedValue = (value ?? "").trim();
  if (!/^\d+$/.test(trimmedValue)) return "";

  return trimmedValue.replace(/^0+(?=\d)/, "");
}
