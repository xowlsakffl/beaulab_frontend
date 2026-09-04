import type { DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";
import type { NoticeStaffUser } from "./detail";
import { labelNoticeChannel, NOTICE_CHANNEL_OPTIONS, NOTICE_STATUS_OPTIONS } from "./options";

export type NoticeApiItem = {
  id: number;
  channel?: string | null;
  title?: string | null;
  status?: string | null;
  creator?: NoticeStaffUser | null;
  view_count?: number | null;
  created_at?: string | null;
};

export type NoticeRow = {
  id: number;
  channel: string;
  title: string;
  status: string;
  creatorName: string;
  viewCount: number;
  createdAt: string;
};

export type SortField = "id" | "channel" | "title" | "status" | "view_count" | "created_at";
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
};

export type NoticesQuery = {
  q?: string;
  status?: string;
  channel?: string;
  start_date?: string;
  end_date?: string;
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
};

export const NOTICES_PER_PAGE = 15;

export const DATE_PRESET_OPTIONS = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "recent7", label: "최근 7일" },
  { key: "recent30", label: "최근 30일" },
] as const satisfies readonly DatePresetOption[];

export type DatePresetKey = (typeof DATE_PRESET_OPTIONS)[number]["key"];
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

export function normalizeNotice(item: NoticeApiItem): NoticeRow {
  const createdDate = item.created_at ? new Date(item.created_at) : null;
  const creatorName = item.creator?.name ?? "";

  return {
    id: item.id,
    channel: labelNoticeChannel(item.channel),
    title: item.title?.trim() || "-",
    status: item.status?.trim() || "",
    creatorName: creatorName.trim() || "-",
    viewCount: Number(item.view_count ?? 0),
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

export function parseNoticesTableState(searchParams: URLSearchParams) {
  const statuses = (searchParams.get("status") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => NOTICE_STATUS_OPTIONS.some((option) => option.value === value));
  const channels = (searchParams.get("channel") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => NOTICE_CHANNEL_OPTIONS.some((option) => option.value === value));
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const createdDateState = buildFilterDateState(startDate, endDate);

  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const allowedSortFields = new Set<SortField>(["id", "channel", "title", "status", "view_count", "created_at"]);
  const sortFieldParam = searchParams.get("sort");
  const sortDirectionParam = searchParams.get("direction");
  const sortField =
    sortFieldParam && allowedSortFields.has(sortFieldParam as SortField)
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

export function buildNoticesQuery({
  searchKeyword,
  appliedFilters,
  sortState,
  page,
}: {
  searchKeyword: string;
  appliedFilters: Filters;
  sortState: SortState;
  page: number;
}): NoticesQuery {
  const query: NoticesQuery = {
    sort: sortState.enabled ? sortState.field : DEFAULT_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_SORT.direction,
    per_page: NOTICES_PER_PAGE,
    page,
  };

  const trimmedSearch = searchKeyword.trim();
  if (trimmedSearch) query.q = trimmedSearch;
  if (appliedFilters.statuses.length > 0) query.status = appliedFilters.statuses.join(",");
  if (appliedFilters.channels.length > 0) query.channel = appliedFilters.channels.join(",");
  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;
  return query;
}

export function buildNoticesQueryString(query: NoticesQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.channel) params.set("channel", query.channel);
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.sort !== DEFAULT_SORT.field) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_SORT.direction) params.set("direction", query.direction);
  if (query.page !== 1) params.set("page", String(query.page));

  return params.toString();
}

export function buildNoticesReturnToPath(pathname: string, query: NoticesQuery) {
  const queryString = buildNoticesQueryString(query);
  return queryString ? `${pathname}?${queryString}` : pathname;
}
