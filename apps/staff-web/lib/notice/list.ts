import type { CheckboxFilterOption, DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

export type NoticeApiItem = {
  id: number;
  channel?: string | null;
  title?: string | null;
  status?: string | null;
  creator_name?: string | null;
  view_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type NoticeRow = {
  id: number;
  channel: string;
  title: string;
  status: string;
  creatorName: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SortField = "id" | "channel" | "title" | "status" | "view_count" | "created_at" | "updated_at";
export type SortDirection = "asc" | "desc";

export type SortState = {
  field: SortField;
  direction: SortDirection;
  enabled: boolean;
};

export type Filters = {
  statuses: string[];
  channels: string[];
  dateRange: string;
  startDate: string;
  endDate: string;
  updatedDateRange: string;
  updatedStartDate: string;
  updatedEndDate: string;
};

export type NoticesQuery = {
  q?: string;
  status?: string;
  channel?: string;
  start_date?: string;
  end_date?: string;
  updated_start_date?: string;
  updated_end_date?: string;
  sort: SortField;
  direction: SortDirection;
  per_page: number;
  page: number;
};

export const DEFAULT_SORT: SortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

export const DEFAULT_FILTERS: Filters = {
  statuses: [],
  channels: [],
  dateRange: "",
  startDate: "",
  endDate: "",
  updatedDateRange: "",
  updatedStartDate: "",
  updatedEndDate: "",
};

export const NOTICE_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "ACTIVE", label: "정상" },
  { value: "INACTIVE", label: "비활성" },
];

export const NOTICE_CHANNEL_OPTIONS: CheckboxFilterOption[] = [
  { value: "ALL", label: "전체 채널" },
  { value: "APP_WEB", label: "앱/웹" },
  { value: "HOSPITAL", label: "병의원" },
  { value: "BEAUTY", label: "뷰티" },
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
export type DateFilterKey = "created" | "updated";

export function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

export function labelNoticeChannel(channel?: string | null) {
  if (channel === "ALL") return "전체 채널";
  if (channel === "APP_WEB") return "앱/웹";
  if (channel === "HOSPITAL") return "병의원";
  if (channel === "BEAUTY") return "뷰티";
  return channel?.trim() || "-";
}

export function labelNoticeStatus(status?: string | null) {
  if (status === "ACTIVE") return "정상";
  if (status === "INACTIVE") return "비활성";
  return status?.trim() || "-";
}

export function normalizeNotice(item: NoticeApiItem): NoticeRow {
  const createdDate = item.created_at ? new Date(item.created_at) : null;
  const updatedDate = item.updated_at ? new Date(item.updated_at) : null;

  return {
    id: item.id,
    channel: labelNoticeChannel(item.channel),
    title: item.title?.trim() || "-",
    status: item.status?.trim() || "",
    creatorName: item.creator_name?.trim() || "-",
    viewCount: Number(item.view_count ?? 0),
    createdAt: createdDate && !Number.isNaN(createdDate.getTime()) ? formatLocalDate(createdDate) : "-",
    updatedAt: updatedDate && !Number.isNaN(updatedDate.getTime()) ? formatLocalDate(updatedDate) : "-",
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

export function parseNoticesTableState(searchParams: URLSearchParams) {
  const statuses = (searchParams.get("status") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const channels = (searchParams.get("channel") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const updatedStartDate = searchParams.get("updated_start_date") ?? "";
  const updatedEndDate = searchParams.get("updated_end_date") ?? "";
  const createdDateState = buildFilterDateState(startDate, endDate);
  const updatedDateState = buildFilterDateState(updatedStartDate, updatedEndDate);

  const parsedPerPage = Number(searchParams.get("per_page"));
  const allowedPerPageValues = new Set(PER_PAGE_OPTIONS.map((option) => Number(option.value)));
  const perPage = Number.isFinite(parsedPerPage) && allowedPerPageValues.has(parsedPerPage)
    ? parsedPerPage
    : 15;

  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const allowedSortFields = new Set<SortField>(["id", "channel", "title", "status", "view_count", "created_at", "updated_at"]);
  const sortFieldParam = searchParams.get("sort");
  const sortDirectionParam = searchParams.get("direction");
  const sortField = sortFieldParam && allowedSortFields.has(sortFieldParam as SortField)
    ? (sortFieldParam as SortField)
    : DEFAULT_SORT.field;
  const sortDirection: SortDirection = sortDirectionParam === "asc" ? "asc" : "desc";

  return {
    searchKeyword: searchParams.get("q")?.trim() ?? "",
    filters: {
      statuses,
      channels,
      dateRange: createdDateState.label,
      startDate,
      endDate,
      updatedDateRange: updatedDateState.label,
      updatedStartDate,
      updatedEndDate,
    },
    draftDateRange: createdDateState.range,
    draftUpdatedDateRange: updatedDateState.range,
    sortState: {
      field: sortField,
      direction: sortDirection,
      enabled: Boolean(sortFieldParam || sortDirectionParam),
    },
    perPage,
    page,
  };
}

export function buildNoticesQuery({
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
}): NoticesQuery {
  const query: NoticesQuery = {
    sort: sortState.enabled ? sortState.field : DEFAULT_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_SORT.direction,
    per_page: perPage,
    page,
  };

  const trimmedSearch = searchKeyword.trim();
  if (trimmedSearch) query.q = trimmedSearch;
  if (appliedFilters.statuses.length > 0) query.status = appliedFilters.statuses.join(",");
  if (appliedFilters.channels.length > 0) query.channel = appliedFilters.channels.join(",");
  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;
  if (appliedFilters.updatedStartDate) query.updated_start_date = appliedFilters.updatedStartDate;
  if (appliedFilters.updatedEndDate) query.updated_end_date = appliedFilters.updatedEndDate;

  return query;
}

export function buildNoticesQueryString(query: NoticesQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.channel) params.set("channel", query.channel);
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.updated_start_date) params.set("updated_start_date", query.updated_start_date);
  if (query.updated_end_date) params.set("updated_end_date", query.updated_end_date);
  if (query.sort !== DEFAULT_SORT.field) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_SORT.direction) params.set("direction", query.direction);
  if (query.per_page !== 15) params.set("per_page", String(query.per_page));
  if (query.page !== 1) params.set("page", String(query.page));

  return params.toString();
}

export function buildNoticesReturnToPath(pathname: string, query: NoticesQuery) {
  const queryString = buildNoticesQueryString(query);
  return queryString ? `${pathname}?${queryString}` : pathname;
}
