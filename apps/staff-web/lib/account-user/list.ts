import type { DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

export type AccountUserDateType = "created_at" | "last_accessed_at";
export type AccountUserSortDirection = "asc" | "desc";
export type AccountUserSortField =
  | "id"
  | "email"
  | "nickname"
  | "name"
  | "signup_channel"
  | "status"
  | "warning_count"
  | "created_at"
  | "last_accessed_at";

export type AccountUserOption<T extends string = string> = {
  value: T;
  label: string;
};

export type AccountUserFilters = {
  dateType: AccountUserDateType;
  dateRange: string;
  startDate: string;
  endDate: string;
  signupChannel: string;
  status: string;
  warningCountMin: string;
  warningCountMax: string;
};

export type AccountUserSortState = {
  field: AccountUserSortField;
  direction: AccountUserSortDirection;
  enabled: boolean;
};

export type AccountUserQuery = {
  q?: string;
  date_type?: AccountUserDateType;
  start_date?: string;
  end_date?: string;
  signup_channel?: string;
  status?: string;
  warning_count_min?: string;
  warning_count_max?: string;
  sort: AccountUserSortField;
  direction: AccountUserSortDirection;
  per_page: number;
  page: number;
};

export type AccountUserApiItem = {
  id?: number | null;
  signup_channel?: string | null;
  signup_channel_label?: string | null;
  email?: string | null;
  nickname?: string | null;
  name?: string | null;
  phone?: string | null;
  status?: string | null;
  status_label?: string | null;
  warning_count?: number | null;
  created_at?: string | null;
  last_accessed_at?: string | null;
  last_access_ip?: string | null;
};

export type AccountUserRow = {
  id: number;
  signupChannel: string;
  signupChannelLabel: string;
  email: string;
  nickname: string;
  name: string;
  phone: string;
  status: string;
  statusLabel: string;
  warningCount: number;
  createdAt: string;
  lastAccessedAt: string;
  lastAccessIp: string;
};

export type AccountUserSignupChannelSummary = {
  channel?: string | null;
  label?: string | null;
  count?: number | null;
};

export type AccountUserSummary = {
  daily_visitors?: number | null;
  monthly_visitors?: number | null;
  total_users?: number | null;
  withdrawn_users?: number | null;
  blocked_users?: number | null;
  warned_users?: number | null;
  signup_channels?: AccountUserSignupChannelSummary[] | null;
};

export const ACCOUNT_USERS_PER_PAGE = 15;

export const ACCOUNT_USER_DATE_TYPE_OPTIONS: AccountUserOption<AccountUserDateType>[] = [
  { value: "created_at", label: "가입일" },
  { value: "last_accessed_at", label: "접속일" },
];

export const ACCOUNT_USER_DATE_PRESET_OPTIONS: DatePresetOption[] = [
  { key: "today", label: "오늘" },
  { key: "last7days", label: "최근 7일" },
  { key: "last30days", label: "최근 30일" },
];

export const ACCOUNT_USER_SIGNUP_CHANNEL_OPTIONS: AccountUserOption[] = [
  { value: "", label: "전체" },
  { value: "KAKAO", label: "카카오톡" },
  { value: "NAVER", label: "네이버" },
  { value: "EMAIL", label: "이메일" },
  { value: "APPLE", label: "애플" },
  { value: "FACEBOOK", label: "페이스북" },
  { value: "EMAIL_NO_CONTACT", label: "이메일(연락처 x)" },
  { value: "UNKNOWN", label: "미확인" },
];

export const ACCOUNT_USER_STATUS_OPTIONS: AccountUserOption[] = [
  { value: "", label: "전체" },
  { value: "ACTIVE", label: "정상" },
  { value: "SUSPENDED", label: "정지" },
  { value: "BLOCKED", label: "차단" },
  { value: "WITHDRAWN", label: "탈퇴" },
];

export const DEFAULT_ACCOUNT_USER_FILTERS: AccountUserFilters = {
  dateType: "created_at",
  dateRange: "전체",
  startDate: "",
  endDate: "",
  signupChannel: "",
  status: "",
  warningCountMin: "",
  warningCountMax: "",
};

export const DEFAULT_ACCOUNT_USER_SORT: AccountUserSortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

export function parseAccountUsersTableState(searchParams: URLSearchParams) {
  const filters: AccountUserFilters = {
    dateType: normalizeDateType(searchParams.get("date_type")),
    dateRange: formatDateRangeLabel(searchParams.get("start_date") ?? "", searchParams.get("end_date") ?? ""),
    startDate: searchParams.get("start_date") ?? "",
    endDate: searchParams.get("end_date") ?? "",
    signupChannel: searchParams.get("signup_channel") ?? "",
    status: searchParams.get("status") ?? "",
    warningCountMin: searchParams.get("warning_count_min") ?? "",
    warningCountMax: searchParams.get("warning_count_max") ?? "",
  };

  return {
    searchKeyword: searchParams.get("q") ?? "",
    filters,
    draftDateRange: parseDateRange(filters.startDate, filters.endDate),
    sortState: {
      field: normalizeSortField(searchParams.get("sort")),
      direction: searchParams.get("direction") === "asc" ? "asc" : "desc",
      enabled: true,
    } satisfies AccountUserSortState,
    page: parsePositiveInt(searchParams.get("page"), 1),
  };
}

export function buildAccountUsersQuery({
  searchKeyword,
  appliedFilters,
  sortState,
  page,
}: {
  searchKeyword: string;
  appliedFilters: AccountUserFilters;
  sortState: AccountUserSortState;
  page: number;
}): AccountUserQuery {
  return {
    ...(searchKeyword.trim() ? { q: searchKeyword.trim() } : {}),
    date_type: appliedFilters.dateType,
    ...(appliedFilters.startDate ? { start_date: appliedFilters.startDate } : {}),
    ...(appliedFilters.endDate ? { end_date: appliedFilters.endDate } : {}),
    ...(appliedFilters.signupChannel ? { signup_channel: appliedFilters.signupChannel } : {}),
    ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
    ...(appliedFilters.warningCountMin ? { warning_count_min: appliedFilters.warningCountMin } : {}),
    ...(appliedFilters.warningCountMax ? { warning_count_max: appliedFilters.warningCountMax } : {}),
    sort: sortState.field,
    direction: sortState.direction,
    per_page: ACCOUNT_USERS_PER_PAGE,
    page,
  };
}

export function buildAccountUsersQueryString(query: AccountUserQuery) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  return params.toString();
}

export function normalizeAccountUser(item: AccountUserApiItem): AccountUserRow {
  return {
    id: Number(item.id ?? 0),
    signupChannel: item.signup_channel?.trim() || "UNKNOWN",
    signupChannelLabel: item.signup_channel_label?.trim() || "-",
    email: item.email?.trim() || "-",
    nickname: item.nickname?.trim() || "-",
    name: item.name?.trim() || "-",
    phone: item.phone?.trim() || "-",
    status: item.status?.trim() || "ACTIVE",
    statusLabel: item.status_label?.trim() || item.status?.trim() || "-",
    warningCount: Number(item.warning_count ?? 0),
    createdAt: formatApiDateTime(item.created_at),
    lastAccessedAt: formatApiDateTime(item.last_accessed_at),
    lastAccessIp: item.last_access_ip?.trim() || "-",
  };
}

export function nextAccountUserSortState(
  current: AccountUserSortState,
  field: AccountUserSortField,
): AccountUserSortState {
  if (current.field !== field) {
    return { field, direction: "desc", enabled: true };
  }

  return {
    field,
    direction: current.direction === "desc" ? "asc" : "desc",
    enabled: true,
  };
}

export function mapDateRangeToAccountUserFilter(range?: DateRange) {
  const startDate = range?.from ? normalizeRangeDate(range.from) : "";
  const endDate = range?.to ? normalizeRangeDate(range.to) : "";

  return {
    startDate,
    endDate,
    label: formatDateRangeLabel(startDate, endDate),
  };
}

export function buildAccountUserPresetDateRange(preset: string): DateRange | undefined {
  const today = new Date();
  const end = normalizeDate(today);
  const start = normalizeDate(today);

  if (preset === "today") {
    return { from: start, to: end };
  }

  if (preset === "last7days") {
    start.setDate(start.getDate() - 6);
    return { from: start, to: end };
  }

  if (preset === "last30days") {
    start.setDate(start.getDate() - 29);
    return { from: start, to: end };
  }

  return undefined;
}

export function formatAccountUserStatusColor(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "SUSPENDED") return "warning" as const;

  return "error" as const;
}

export function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeDateType(value: string | null): AccountUserDateType {
  return value === "last_accessed_at" ? "last_accessed_at" : "created_at";
}

function normalizeSortField(value: string | null): AccountUserSortField {
  const allowed = new Set<AccountUserSortField>([
    "id",
    "email",
    "nickname",
    "name",
    "signup_channel",
    "status",
    "warning_count",
    "created_at",
    "last_accessed_at",
  ]);

  return value && allowed.has(value as AccountUserSortField) ? value as AccountUserSortField : "id";
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseDateRange(startDate: string, endDate: string): DateRange | undefined {
  const from = startDate ? new Date(`${startDate}T00:00:00`) : undefined;
  const to = endDate ? new Date(`${endDate}T00:00:00`) : undefined;

  if (!from && !to) return undefined;

  return {
    from: from && !Number.isNaN(from.getTime()) ? from : undefined,
    to: to && !Number.isNaN(to.getTime()) ? to : undefined,
  };
}

function normalizeRangeDate(date: Date) {
  return formatLocalDate(normalizeDate(date));
}

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateRangeLabel(startDate: string, endDate: string) {
  if (!startDate && !endDate) return "전체";
  if (startDate && endDate) return `${startDate} ~ ${endDate}`;
  if (startDate) return `${startDate} ~`;

  return `~ ${endDate}`;
}

function formatApiDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${formatLocalDate(date)} ${hours}:${minutes}`;
}
