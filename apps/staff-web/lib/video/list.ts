import type { CheckboxFilterOption, DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

type MediaAsset = {
  path?: string | null;
  url?: string | null;
};

export type VideoApiItem = {
  id: number;
  hospital_id: number;
  hospital_name?: string | null;
  doctor_id?: number | null;
  doctor_name?: string | null;
  title: string;
  thumbnail_file?: MediaAsset | null;
  activity_scope?: string | null;
  distribution_channel?: string | null;
  view_count?: number | null;
  like_count?: number | null;
  allowed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
  allow_status?: string | null;
};

export type VideoRow = {
  id: number;
  requestedAt: string;
  hospitalName: string;
  doctorName: string;
  title: string;
  thumbnailUrl: string | null;
  distributionChannelLabel: string;
  viewCount: number;
  likeCount: number;
  completedAt: string;
  operatingStatus: string;
  approvalStatus: string;
};

export type SortField =
  | "id"
  | "title"
  | "distribution_channel"
  | "view_count"
  | "like_count"
  | "status"
  | "allow_status"
  | "created_at"
  | "allowed_at";

export type SortDirection = "asc" | "desc";

export type SortState = {
  field: SortField;
  direction: SortDirection;
  enabled: boolean;
};

export type VideosQuery = {
  q?: string;
  status?: string;
  allow_status?: string;
  distribution_channel?: string;
  start_date?: string;
  end_date?: string;
  allowed_start_date?: string;
  allowed_end_date?: string;
  sort: SortField;
  direction: SortDirection;
  per_page: number;
  page: number;
};

export type Filters = {
  operatingStatuses: string[];
  approvalStatuses: string[];
  distributionChannels: string[];
  dateRange: string;
  startDate: string;
  endDate: string;
  allowedDateRange: string;
  allowedStartDate: string;
  allowedEndDate: string;
};

export const DEFAULT_SORT: SortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

export const DEFAULT_FILTERS: Filters = {
  operatingStatuses: [],
  approvalStatuses: [],
  distributionChannels: [],
  dateRange: "",
  startDate: "",
  endDate: "",
  allowedDateRange: "",
  allowedStartDate: "",
  allowedEndDate: "",
};

export const VIDEO_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "ACTIVE", label: "정상" },
  { value: "INACTIVE", label: "비활성" },
];

export const VIDEO_APPROVAL_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "SUBMITTED", label: "검수신청" },
  { value: "IN_REVIEW", label: "검수중" },
  { value: "APPROVED", label: "검수완료" },
  { value: "REJECTED", label: "검수반려" },
  { value: "EXCLUDED", label: "게시제외" },
  { value: "PARTNER_CANCELED", label: "신청취소" },
];

export const VIDEO_DISTRIBUTION_CHANNEL_OPTIONS: CheckboxFilterOption[] = [
  { value: "YOUTUBE_APP", label: "유튜브/앱" },
  { value: "APP", label: "앱" },
];

export const PER_PAGE_OPTIONS = [
  { value: "15", label: "15개" },
  { value: "30", label: "30개" },
  { value: "50", label: "50개" },
];

export const DATE_PRESET_OPTIONS = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "recent7", label: "최근 7일" },
  { key: "recent30", label: "최근 30일" },
] as const satisfies readonly DatePresetOption[];

export type DatePresetKey = (typeof DATE_PRESET_OPTIONS)[number]["key"];
export type DateFilterKey = "created" | "allowed";

export function formatLocalDate(date: Date) {
  const year = date.getFullYear();
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

  const fromDate = formatLocalDate(range.from);
  if (!range.to) return fromDate;

  return `${fromDate} ~ ${formatLocalDate(range.to)}`;
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

export function labelVideoOperatingStatus(status?: string | null) {
  if (status === "ACTIVE") return "정상";
  if (status === "INACTIVE") return "비활성";
  return status || "-";
}

export function labelVideoApprovalStatus(status?: string | null) {
  if (status === "SUBMITTED") return "검수신청";
  if (status === "IN_REVIEW") return "검수중";
  if (status === "APPROVED") return "검수완료";
  if (status === "REJECTED") return "검수반려";
  if (status === "EXCLUDED") return "게시제외";
  if (status === "PARTNER_CANCELED") return "신청취소";
  return status || "-";
}

export function labelVideoDistributionChannel(channel?: string | null) {
  if (!channel) return "-";
  if (channel === "YOUTUBE_APP" || channel === "YOUTUBE") return "유튜브/앱";
  if (channel === "APP") return "앱";
  return channel;
}

function resolveMediaUrl(media?: MediaAsset | null): string | null {
  const rawUrl = media?.url?.trim();
  if (rawUrl) return rawUrl;

  const rawPath = media?.path?.trim();
  if (!rawPath) return null;
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  if (!API_BASE_URL) return rawPath;
  if (rawPath.startsWith("/storage/")) return `${API_BASE_URL}${rawPath}`;
  if (rawPath.startsWith("storage/")) return `${API_BASE_URL}/${rawPath}`;
  if (rawPath.startsWith("/")) return `${API_BASE_URL}${rawPath}`;

  return `${API_BASE_URL}/storage/${rawPath}`;
}

export function normalizeVideo(item: VideoApiItem): VideoRow {
  return {
    id: item.id,
    requestedAt: formatLocalDateTime(item.created_at),
    hospitalName: item.hospital_name?.trim() || "-",
    doctorName: item.doctor_name?.trim() || "-",
    title: item.title?.trim() || "-",
    thumbnailUrl: resolveMediaUrl(item.thumbnail_file),
    distributionChannelLabel: labelVideoDistributionChannel(item.distribution_channel),
    viewCount: Number(item.view_count ?? 0),
    likeCount: Number(item.like_count ?? 0),
    completedAt: formatLocalDateTime(item.allowed_at),
    operatingStatus: item.status || "",
    approvalStatus: item.allow_status || "",
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

export function parseVideosTableState(searchParams: URLSearchParams) {
  const operatingStatuses = (searchParams.get("status") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const approvalStatuses = (searchParams.get("allow_status") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const distributionChannels = (searchParams.get("distribution_channel") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const allowedStartDate = searchParams.get("allowed_start_date") ?? "";
  const allowedEndDate = searchParams.get("allowed_end_date") ?? "";
  const createdDateState = buildFilterDateState(startDate, endDate);
  const allowedDateState = buildFilterDateState(allowedStartDate, allowedEndDate);
  const parsedPerPage = Number(searchParams.get("per_page"));
  const allowedPerPageValues = new Set(PER_PAGE_OPTIONS.map((option) => Number(option.value)));
  const perPage = Number.isFinite(parsedPerPage) && allowedPerPageValues.has(parsedPerPage)
    ? parsedPerPage
    : 15;

  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const allowedSortFields = new Set<SortField>([
    "id",
    "title",
    "distribution_channel",
    "view_count",
    "like_count",
    "status",
    "allow_status",
    "created_at",
    "allowed_at",
  ]);

  const sortFieldParam = searchParams.get("sort");
  const sortDirectionParam = searchParams.get("direction");
  const sortField = sortFieldParam && allowedSortFields.has(sortFieldParam as SortField)
    ? (sortFieldParam as SortField)
    : DEFAULT_SORT.field;
  const sortDirection: SortDirection = sortDirectionParam === "asc" ? "asc" : "desc";

  return {
    searchKeyword: searchParams.get("q")?.trim() ?? "",
    filters: {
      operatingStatuses,
      approvalStatuses,
      distributionChannels,
      dateRange: createdDateState.label,
      startDate,
      endDate,
      allowedDateRange: allowedDateState.label,
      allowedStartDate,
      allowedEndDate,
    },
    draftDateRange: createdDateState.range,
    draftAllowedDateRange: allowedDateState.range,
    sortState: {
      field: sortField,
      direction: sortDirection,
      enabled: Boolean(sortFieldParam || sortDirectionParam),
    },
    perPage,
    page,
  };
}

export function buildVideosQuery({
  searchKeyword,
  appliedFilters,
  sortState,
  perPage,
  page,
}: {
  searchKeyword: string;
  appliedFilters: Filters;
  sortState: SortState;
  perPage: number;
  page: number;
}): VideosQuery {
  const query: VideosQuery = {
    sort: sortState.enabled ? sortState.field : DEFAULT_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_SORT.direction,
    per_page: perPage,
    page,
  };

  const trimmedSearch = searchKeyword.trim();
  if (trimmedSearch) query.q = trimmedSearch;
  if (appliedFilters.operatingStatuses.length > 0) query.status = appliedFilters.operatingStatuses.join(",");
  if (appliedFilters.approvalStatuses.length > 0) query.allow_status = appliedFilters.approvalStatuses.join(",");
  if (appliedFilters.distributionChannels.length > 0) {
    query.distribution_channel = appliedFilters.distributionChannels.join(",");
  }
  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;
  if (appliedFilters.allowedStartDate) query.allowed_start_date = appliedFilters.allowedStartDate;
  if (appliedFilters.allowedEndDate) query.allowed_end_date = appliedFilters.allowedEndDate;

  return query;
}

export function buildVideosReturnToPath(pathname: string, query: VideosQuery) {
  const returnQuery = buildVideosQueryString(query);
  return returnQuery ? `${pathname}?${returnQuery}` : pathname;
}

export function buildVideosQueryString(query: VideosQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.allow_status) params.set("allow_status", query.allow_status);
  if (query.distribution_channel) params.set("distribution_channel", query.distribution_channel);
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.allowed_start_date) params.set("allowed_start_date", query.allowed_start_date);
  if (query.allowed_end_date) params.set("allowed_end_date", query.allowed_end_date);
  if (query.sort !== DEFAULT_SORT.field) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_SORT.direction) params.set("direction", query.direction);
  if (query.per_page !== 15) params.set("per_page", String(query.per_page));
  if (query.page !== 1) params.set("page", String(query.page));

  return params.toString();
}
