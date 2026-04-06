import type { CheckboxFilterOption, DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

export type HashtagApiItem = {
  id: number;
  name?: string | null;
  normalized_name?: string | null;
  status?: string | null;
  usage_count?: number | null;
  assignment_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type HashtagRow = {
  id: number;
  name: string;
  normalizedName: string;
  status: string;
  usageCount: number;
  assignmentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SortField = "id" | "name" | "normalized_name" | "status" | "usage_count" | "created_at" | "updated_at";
export type SortDirection = "asc" | "desc";

export type SortState = {
  field: SortField;
  direction: SortDirection;
  enabled: boolean;
};

export type Filters = {
  statuses: string[];
  dateRange: string;
  startDate: string;
  endDate: string;
  updatedDateRange: string;
  updatedStartDate: string;
  updatedEndDate: string;
};

export type HashtagsQuery = {
  q?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  updated_start_date?: string;
  updated_end_date?: string;
  sort: SortField;
  direction: SortDirection;
  per_page: number;
  page: number;
};

export const HASHTAG_NAME_MAX_LENGTH = 20;
export const HASHTAG_NAME_PATTERN = /^[0-9A-Za-z가-힣_]+$/u;
export const HASHTAG_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "ACTIVE", label: "활성" },
  { value: "INACTIVE", label: "비활성" },
];

export const DEFAULT_FILTERS: Filters = {
  statuses: [],
  dateRange: "",
  startDate: "",
  endDate: "",
  updatedDateRange: "",
  updatedStartDate: "",
  updatedEndDate: "",
};

export const DEFAULT_SORT: SortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

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

export function sanitizeHashtagName(value: string) {
  return value.replace(/^[#＃]+/u, "").trim();
}

export function normalizeHashtagName(value: string) {
  const sanitized = sanitizeHashtagName(value);

  if (!sanitized) return "";

  return typeof sanitized.normalize === "function"
    ? sanitized.normalize("NFKC").toLowerCase()
    : sanitized.toLowerCase();
}

export function validateHashtagName(value: string) {
  const sanitized = sanitizeHashtagName(value);

  if (!sanitized) {
    return "해시태그명을 입력해 주세요.";
  }

  if (sanitized.length > HASHTAG_NAME_MAX_LENGTH) {
    return `해시태그명은 ${HASHTAG_NAME_MAX_LENGTH}자 이하여야 합니다.`;
  }

  if (!HASHTAG_NAME_PATTERN.test(sanitized)) {
    return "해시태그명은 영문, 숫자, 한글, 밑줄(_)만 사용할 수 있습니다.";
  }

  return null;
}

export function labelHashtagStatus(status: string) {
  if (status === "ACTIVE") return "활성";
  if (status === "INACTIVE" || status === "BLOCKED") return "비활성";
  return status;
}

export function sanitizeHashtagSearchKeyword(value: string) {
  return sanitizeHashtagName(value);
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

export function normalizeHashtag(item: HashtagApiItem): HashtagRow {
  const createdDate = item.created_at ? new Date(item.created_at) : null;
  const updatedDate = item.updated_at ? new Date(item.updated_at) : null;

  return {
    id: item.id,
    name: item.name?.trim() || "-",
    normalizedName: item.normalized_name?.trim() || "-",
    status: item.status?.trim() || "ACTIVE",
    usageCount: Number(item.usage_count ?? item.assignment_count ?? 0),
    assignmentCount: Number(item.assignment_count ?? 0),
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

export function parseHashtagsTableState(searchParams: URLSearchParams) {
  const statuses = (searchParams.get("status") ?? "")
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

  const allowedSortFields = new Set<SortField>(["id", "name", "normalized_name", "status", "usage_count", "created_at", "updated_at"]);
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

export function buildHashtagsQuery({
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
}): HashtagsQuery {
  const query: HashtagsQuery = {
    sort: sortState.enabled ? sortState.field : DEFAULT_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_SORT.direction,
    per_page: perPage,
    page,
  };

  const trimmedSearch = sanitizeHashtagSearchKeyword(searchKeyword);
  if (trimmedSearch) query.q = trimmedSearch;
  if (appliedFilters.statuses.length > 0) query.status = appliedFilters.statuses.join(",");
  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;
  if (appliedFilters.updatedStartDate) query.updated_start_date = appliedFilters.updatedStartDate;
  if (appliedFilters.updatedEndDate) query.updated_end_date = appliedFilters.updatedEndDate;

  return query;
}

export function buildHashtagsQueryString(query: HashtagsQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
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
