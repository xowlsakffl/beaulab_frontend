import type { BadgeColor, CheckboxFilterOption, DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

import { CATEGORY_USAGES } from "@/lib/common/category";
import { resolveMediaAssetUrl } from "@/lib/common/media";
import { labelAdminStatus, labelOwnerVisibilityStatus, ownerVisibilityStatusColor } from "@/lib/common/status-labels";

type MediaAsset = {
  path?: string | null;
  url?: string | null;
  metadata?: unknown;
};

type VideoHospitalRef = {
  id?: number | null;
  name?: string | null;
  business_number?: string | null;
};

type VideoDoctorRef = {
  id?: number | null;
  name?: string | null;
  position?: string | null;
};

type VideoManagerStaffRef = {
  id?: number | null;
  name?: string | null;
  email?: string | null;
};

type VideoReportState = {
  status?: string | null;
  label?: string | null;
  report_count?: number | null;
};

export type VideoCategory = {
  id?: number | null;
  code?: string | null;
  domain?: string | null;
  name?: string | null;
  full_path?: string | null;
};

export type VideoApiItem = {
  id: number;
  hospital?: VideoHospitalRef | null;
  doctor?: VideoDoctorRef | null;
  manager_staff?: VideoManagerStaffRef | null;
  title?: string | null;
  thumbnail_file?: MediaAsset | null;
  external_video_url?: string | null;
  hospital_status?: string | null;
  hospital_status_label?: string | null;
  admin_status?: string | null;
  admin_status_label?: string | null;
  view_count?: number | null;
  like_count?: number | null;
  report_state?: VideoReportState | null;
  categories?: VideoCategory[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type VideoRow = {
  id: number;
  uploadedAt: string;
  hospitalId: number | null;
  hospitalName: string;
  doctorName: string;
  title: string;
  thumbnailUrl: string | null;
  externalVideoUrl: string;
  categoryLabel: string;
  categoryBadges: Array<{
    label: string;
  }>;
  hospitalStatus: string;
  hospitalStatusLabel: string;
  adminStatus: string;
  adminStatusLabel: string;
  reportStatus: string;
  reportStatusLabel: string;
  reportCount: number;
  viewCount: number;
  likeCount: number;
  managerName: string;
};

export type VideoSortField =
  "id" | "title" | "hospital_status" | "admin_status" | "view_count" | "like_count" | "created_at" | "updated_at";

export type SortField = VideoSortField;
export type VideoSortDirection = "asc" | "desc";
export type SortDirection = VideoSortDirection;
export type VideoMetric = "report_count" | "view_count" | "like_count";
export type VideoSummaryFilter = "normal" | "limited" | "reported";

export type VideoSummary = {
  normal_videos?: number | null;
  limited_videos?: number | null;
  reported_videos?: number | null;
};

export type VideoSortState = {
  field: VideoSortField;
  direction: VideoSortDirection;
  enabled: boolean;
};

export type SortState = VideoSortState;

export type VideosQuery = {
  q?: string;
  summary_filter?: VideoSummaryFilter;
  category_id?: string;
  hospital_status?: string;
  admin_status?: string;
  report_status?: string;
  report_count_min?: string;
  report_count_max?: string;
  view_count_min?: string;
  view_count_max?: string;
  like_count_min?: string;
  like_count_max?: string;
  start_date?: string;
  end_date?: string;
  sort: VideoSortField;
  direction: VideoSortDirection;
  per_page: number;
  page: number;
};

export type Filters = {
  summaryFilter: VideoSummaryFilter | "";
  dateRange: string;
  startDate: string;
  endDate: string;
  categoryId: string;
  hospitalStatus: string;
  reportStatuses: string[];
  metric: VideoMetric;
  metricMin: string;
  metricMax: string;
  adminStatus: string;
};

export const VIDEO_LIST_PER_PAGE = 15;

export const DEFAULT_SORT: VideoSortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

export const DEFAULT_FILTERS: Filters = {
  summaryFilter: "",
  dateRange: "",
  startDate: "",
  endDate: "",
  categoryId: "",
  hospitalStatus: "",
  reportStatuses: [],
  metric: "report_count",
  metricMin: "",
  metricMax: "",
  adminStatus: "",
};

export const VIDEO_CATEGORY_USAGES = [CATEGORY_USAGES.HOSPITAL_VIDEO_CATEGORY] as const;

export const VIDEO_HOSPITAL_STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "PUBLIC", label: "공개" },
  { value: "PRIVATE", label: "미공개" },
];

export const VIDEO_ADMIN_STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "NORMAL", label: "정상" },
  { value: "FORCED_STOPPED", label: "강제중지" },
];

export const VIDEO_REPORT_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "REPORTED", label: "신고접수" },
  { value: "ADMIN_HIDDEN", label: "삭제처리" },
  { value: "NORMAL_VISIBLE", label: "신고오류" },
];

export const VIDEO_METRIC_OPTIONS: { value: VideoMetric; label: string }[] = [
  { value: "report_count", label: "신고횟수" },
  { value: "view_count", label: "조회수" },
  { value: "like_count", label: "좋아요수" },
];

export const DATE_PRESET_OPTIONS = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "recent7", label: "최근 7일" },
  { key: "recent30", label: "최근 30일" },
] as const satisfies readonly DatePresetOption[];

export type DatePresetKey = (typeof DATE_PRESET_OPTIONS)[number]["key"];

const VIDEO_SORT_FIELDS = new Set<VideoSortField>([
  "id",
  "title",
  "hospital_status",
  "admin_status",
  "view_count",
  "like_count",
  "created_at",
  "updated_at",
]);
const VIDEO_HOSPITAL_STATUS_VALUE_SET = new Set(VIDEO_HOSPITAL_STATUS_OPTIONS.map((option) => option.value));
const VIDEO_ADMIN_STATUS_VALUE_SET = new Set(VIDEO_ADMIN_STATUS_OPTIONS.map((option) => option.value));
const VIDEO_REPORT_STATUS_VALUE_SET = new Set(VIDEO_REPORT_STATUS_OPTIONS.map((option) => option.value));
const VIDEO_METRIC_VALUE_SET = new Set(VIDEO_METRIC_OPTIONS.map((option) => option.value));
const VIDEO_SUMMARY_FILTER_VALUE_SET = new Set<VideoSummaryFilter>(["normal", "limited", "reported"]);

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

export function formatLocalDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${formatLocalDate(date)} ${hours}:${minutes}`;
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

export function normalizeNumberBound(value: string | null | undefined) {
  const trimmedValue = (value ?? "").trim();
  if (!/^\d+$/.test(trimmedValue)) return "";

  return trimmedValue.replace(/^0+(?=\d)/, "");
}

function expandVideoReportStatuses(statuses: string[]) {
  const result = new Set(statuses);

  if (result.has("REPORTED")) {
    result.add("AUTO_BLOCKED");
  }

  if (result.has("NORMAL_VISIBLE")) {
    result.add("REEXPOSED");
  }

  return Array.from(result);
}

export function labelVideoHospitalStatus(status?: string | null, fallbackLabel = "-") {
  return labelOwnerVisibilityStatus(status, {
    privateLabel: "미공개",
    fallbackLabel,
  });
}

export function videoHospitalStatusColor(status?: string | null): BadgeColor {
  return ownerVisibilityStatusColor(status);
}

export function labelVideoAdminStatus(status?: string | null, fallbackLabel = "-") {
  return labelAdminStatus(status, fallbackLabel);
}

export function labelVideoReportStatus(status?: string | null, fallbackLabel = "-") {
  if (status === "NONE") return "-";
  if (status === "REPORTED") return "신고접수";
  if (status === "AUTO_BLOCKED") return "신고접수";
  if (status === "ADMIN_HIDDEN") return "삭제처리";
  if (status === "NORMAL_VISIBLE") return "신고오류";
  if (status === "REEXPOSED") return "신고오류";

  return status?.trim() || fallbackLabel;
}

export function labelVideoOperatingStatus(status?: string | null) {
  if (status === "ACTIVE") return "정상";
  if (status === "INACTIVE") return "비활성";

  return labelVideoAdminStatus(status);
}

export function labelVideoApprovalStatus(status?: string | null) {
  if (status === "PENDING" || status === "SUBMITTED") return "신청";
  if (status === "REVIEWING" || status === "IN_REVIEW") return "검수";
  if (status === "APPROVED") return "승인";
  if (status === "REJECTED") return "반려";
  if (status === "EXCLUDED") return "검수제외";
  if (status === "PARTNER_CANCELED") return "신청취소";

  return status?.trim() || "-";
}

export function labelVideoDistributionChannel(channel?: string | null) {
  if (!channel) return "-";
  if (channel === "YOUTUBE_APP" || channel === "YOUTUBE") return "유튜브/앱";
  if (channel === "APP") return "앱";

  return channel;
}

function resolveMediaUrl(media?: MediaAsset | null): string | null {
  return resolveMediaAssetUrl(media, "thumb");
}

function formatVideoCategory(category?: VideoCategory | null, maxDepth = 1) {
  const rawPath = category?.full_path?.trim() || category?.name?.trim() || "";

  return rawPath
    .split(">")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxDepth)
    .join(" > ");
}

function formatVideoCategories(categories?: VideoCategory[] | null) {
  const values = Array.from(
    new Set((categories ?? []).map((category) => formatVideoCategory(category, 1)).filter(Boolean)),
  );

  return values.length > 0 ? values.join("\n") : "-";
}

function formatVideoCategoryBadges(categories?: VideoCategory[] | null) {
  const seenLabels = new Set<string>();

  return (categories ?? []).flatMap((category) => {
    const label = formatVideoCategory(category, 1);
    if (!label || seenLabels.has(label)) return [];

    seenLabels.add(label);

    return [
      {
        label,
      },
    ];
  });
}

export function normalizeVideo(item: VideoApiItem): VideoRow {
  const hospitalStatus = item.hospital_status?.trim() || "PUBLIC";
  const adminStatus = item.admin_status?.trim() || "NORMAL";
  const reportStatus = item.report_state?.status?.trim() || "NONE";
  const categoryBadges = formatVideoCategoryBadges(item.categories);
  const managerName = item.manager_staff?.name?.trim() || "-";

  return {
    id: item.id,
    uploadedAt: formatLocalDateTime(item.created_at),
    hospitalId: item.hospital?.id ? Number(item.hospital.id) : null,
    hospitalName: item.hospital?.name?.trim() || "-",
    doctorName: item.doctor?.name?.trim() || "-",
    title: item.title?.trim() || "-",
    thumbnailUrl: resolveMediaUrl(item.thumbnail_file),
    externalVideoUrl: item.external_video_url?.trim() || "",
    categoryLabel:
      categoryBadges.length > 0
        ? categoryBadges.map((category) => category.label).join("\n")
        : formatVideoCategories(item.categories),
    categoryBadges,
    hospitalStatus,
    hospitalStatusLabel: item.hospital_status_label?.trim() || labelVideoHospitalStatus(hospitalStatus),
    adminStatus,
    adminStatusLabel: item.admin_status_label?.trim() || labelVideoAdminStatus(adminStatus),
    reportStatus,
    reportStatusLabel:
      reportStatus === "NONE"
        ? "-"
        : labelVideoReportStatus(reportStatus, item.report_state?.label?.trim() || undefined),
    reportCount: Number(item.report_state?.report_count ?? 0),
    viewCount: Number(item.view_count ?? 0),
    likeCount: Number(item.like_count ?? 0),
    managerName,
  };
}

export function nextSortState(prev: VideoSortState, field: VideoSortField): VideoSortState {
  if (prev.field !== field) return { field, direction: "desc", enabled: true };
  if (prev.enabled && prev.direction === "desc") return { field, direction: "asc", enabled: true };
  if (prev.enabled && prev.direction === "asc") return { ...DEFAULT_SORT, enabled: false };

  return { field, direction: "desc", enabled: true };
}

export function parseVideosTableState(searchParams: URLSearchParams) {
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const dateState = buildFilterDateState(startDate, endDate);
  const hospitalStatus = searchParams.get("hospital_status") ?? "";
  const adminStatus = searchParams.get("admin_status") ?? "";
  const reportStatuses = normalizeListParam(searchParams.get("report_status")).filter((value) =>
    VIDEO_REPORT_STATUS_VALUE_SET.has(value),
  );
  const summaryFilter = normalizeVideoSummaryFilter(searchParams.get("summary_filter"));
  const metric = resolveMetricFromParams(searchParams);
  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const sortFieldParam = searchParams.get("sort");
  const sortDirectionParam = searchParams.get("direction");
  const sortField =
    sortFieldParam && VIDEO_SORT_FIELDS.has(sortFieldParam as VideoSortField)
      ? (sortFieldParam as VideoSortField)
      : DEFAULT_SORT.field;
  const sortDirection: VideoSortDirection = sortDirectionParam === "asc" ? "asc" : "desc";

  return {
    searchKeyword: searchParams.get("q")?.trim() ?? "",
    filters: {
      ...DEFAULT_FILTERS,
      summaryFilter,
      dateRange: dateState.label,
      startDate,
      endDate,
      categoryId: normalizePositiveId(searchParams.get("category_id")),
      hospitalStatus: VIDEO_HOSPITAL_STATUS_VALUE_SET.has(hospitalStatus) ? hospitalStatus : "",
      reportStatuses,
      metric,
      metricMin: normalizeNumberBound(searchParams.get(`${metric}_min`)),
      metricMax: normalizeNumberBound(searchParams.get(`${metric}_max`)),
      adminStatus: VIDEO_ADMIN_STATUS_VALUE_SET.has(adminStatus) ? adminStatus : "",
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

export function buildVideosQuery({
  searchKeyword,
  appliedFilters,
  sortState,
  page,
}: {
  searchKeyword: string;
  appliedFilters: Filters;
  sortState: VideoSortState;
  page: number;
}): VideosQuery {
  const query: VideosQuery = {
    sort: sortState.enabled ? sortState.field : DEFAULT_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_SORT.direction,
    per_page: VIDEO_LIST_PER_PAGE,
    page,
  };

  const trimmedSearch = searchKeyword.trim();
  if (trimmedSearch) query.q = trimmedSearch;
  if (appliedFilters.summaryFilter) query.summary_filter = appliedFilters.summaryFilter;
  if (appliedFilters.categoryId) query.category_id = appliedFilters.categoryId;
  if (appliedFilters.hospitalStatus) query.hospital_status = appliedFilters.hospitalStatus;
  if (appliedFilters.adminStatus) query.admin_status = appliedFilters.adminStatus;
  if (appliedFilters.reportStatuses.length > 0) {
    query.report_status = expandVideoReportStatuses(appliedFilters.reportStatuses).join(",");
  }
  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;

  const metricMin = normalizeNumberBound(appliedFilters.metricMin);
  const metricMax = normalizeNumberBound(appliedFilters.metricMax);
  if (metricMin || metricMax) {
    query[`${appliedFilters.metric}_min`] = metricMin || undefined;
    query[`${appliedFilters.metric}_max`] = metricMax || undefined;
  }

  return query;
}

export function buildVideosQueryString(query: VideosQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.summary_filter) params.set("summary_filter", query.summary_filter);
  if (query.category_id) params.set("category_id", query.category_id);
  if (query.hospital_status) params.set("hospital_status", query.hospital_status);
  if (query.admin_status) params.set("admin_status", query.admin_status);
  if (query.report_status) params.set("report_status", query.report_status);
  if (query.report_count_min) params.set("report_count_min", query.report_count_min);
  if (query.report_count_max) params.set("report_count_max", query.report_count_max);
  if (query.view_count_min) params.set("view_count_min", query.view_count_min);
  if (query.view_count_max) params.set("view_count_max", query.view_count_max);
  if (query.like_count_min) params.set("like_count_min", query.like_count_min);
  if (query.like_count_max) params.set("like_count_max", query.like_count_max);
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.sort !== DEFAULT_SORT.field || !DEFAULT_SORT.enabled) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_SORT.direction) params.set("direction", query.direction);
  if (query.page > 1) params.set("page", String(query.page));

  return params.toString();
}

export function buildVideosReturnToPath(pathname: string, query: VideosQuery) {
  const queryString = buildVideosQueryString(query);

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

function normalizeVideoSummaryFilter(value: string | null | undefined): VideoSummaryFilter | "" {
  const normalized = (value ?? "").trim();

  return VIDEO_SUMMARY_FILTER_VALUE_SET.has(normalized as VideoSummaryFilter) ? (normalized as VideoSummaryFilter) : "";
}

function resolveMetricFromParams(searchParams: URLSearchParams): VideoMetric {
  const metricParam = searchParams.get("metric");
  if (metricParam && VIDEO_METRIC_VALUE_SET.has(metricParam as VideoMetric)) {
    return metricParam as VideoMetric;
  }

  if (searchParams.has("view_count_min") || searchParams.has("view_count_max")) return "view_count";
  if (searchParams.has("like_count_min") || searchParams.has("like_count_max")) return "like_count";

  return DEFAULT_FILTERS.metric;
}
