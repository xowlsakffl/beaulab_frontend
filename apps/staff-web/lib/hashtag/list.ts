import type { CheckboxFilterOption } from "@beaulab/ui-admin";

export type HashtagApiItem = {
  id: number;
  name?: string | null;
  normalized_name?: string | null;
  status?: string | null;
  status_label?: string | null;
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
  statusLabel: string;
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
};

export type HashtagsQuery = {
  q?: string;
  status?: string;
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
};

export const DEFAULT_SORT: SortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

export const DEFAULT_PER_PAGE = 50;

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

export function normalizeHashtag(item: HashtagApiItem): HashtagRow {
  const createdDate = item.created_at ? new Date(item.created_at) : null;
  const updatedDate = item.updated_at ? new Date(item.updated_at) : null;

  return {
    id: item.id,
    name: item.name?.trim() || "-",
    normalizedName: item.normalized_name?.trim() || "-",
    status: item.status?.trim() || "ACTIVE",
    statusLabel: item.status_label?.trim() || labelHashtagStatus(item.status?.trim() || "ACTIVE"),
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
  const allowedStatusValues = new Set(HASHTAG_STATUS_OPTIONS.map((option) => option.value));
  const statuses = (searchParams.get("status") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => allowedStatusValues.has(value));

  const parsedPerPage = Number(searchParams.get("per_page"));
  const perPage =
    Number.isFinite(parsedPerPage) && parsedPerPage > 0 && parsedPerPage <= 100 ? parsedPerPage : DEFAULT_PER_PAGE;

  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const allowedSortFields = new Set<SortField>([
    "id",
    "name",
    "normalized_name",
    "status",
    "usage_count",
    "created_at",
    "updated_at",
  ]);
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
    },
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

  return query;
}

export function buildHashtagsQueryString(query: HashtagsQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.sort !== DEFAULT_SORT.field) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_SORT.direction) params.set("direction", query.direction);
  if (query.per_page !== DEFAULT_PER_PAGE) params.set("per_page", String(query.per_page));
  if (query.page !== 1) params.set("page", String(query.page));

  return params.toString();
}
