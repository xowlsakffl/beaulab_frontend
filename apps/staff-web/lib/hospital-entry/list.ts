import type { BadgeColor, CheckboxFilterOption, DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

export type HospitalEntryAllowStatus = "PENDING" | "REVIEWING" | "APPROVED" | "REJECTED";

export type HospitalEntryAllowStatusValue =
  | string
  | {
      code?: string | null;
      label?: string | null;
    };

export type HospitalEntryApiItem = {
  id: number;
  hospital_name?: string | null;
  address?: string | null;
  address_detail?: string | null;
  ceo_name?: string | null;
  applicant_name?: string | null;
  allow_status?: HospitalEntryAllowStatusValue | null;
  created_at?: string | null;
};

export type HospitalEntryRow = {
  id: number;
  requestedAt: string;
  hospitalName: string;
  address: string;
  ceoName: string;
  applicantName: string;
  allowStatus: string;
};

export type HospitalEntrySummary = {
  pending: number;
  reviewing: number;
  rejected: number;
  approved: number;
};

export type HospitalEntrySummaryApiResponse = {
  pending_entries?: number | null;
  reviewing_entries?: number | null;
  rejected_entries?: number | null;
  approved_entries?: number | null;
};

export type SortField =
  "id" | "created_at" | "hospital_name" | "address" | "ceo_name" | "applicant_name" | "allow_status";

export type SortDirection = "asc" | "desc";

export type SortState = {
  field: SortField;
  direction: SortDirection;
  enabled: boolean;
};

export type HospitalEntriesQuery = {
  q?: string;
  allow_status?: string;
  start_date?: string;
  end_date?: string;
  sort: SortField;
  direction: SortDirection;
  per_page: number;
  page: number;
};

export type Filters = {
  allowStatuses: string[];
  dateRange: string;
  startDate: string;
  endDate: string;
};

export const HOSPITAL_ENTRIES_PER_PAGE = 15;

export const DEFAULT_SORT: SortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

export const DEFAULT_FILTERS: Filters = {
  allowStatuses: [],
  dateRange: "",
  startDate: "",
  endDate: "",
};

export const HOSPITAL_ENTRY_ALLOW_STATUS_OPTIONS: CheckboxFilterOption[] = [
  { value: "PENDING", label: "신청" },
  { value: "REVIEWING", label: "검수" },
  { value: "APPROVED", label: "승인" },
  { value: "REJECTED", label: "반려" },
];

export const DATE_PRESET_OPTIONS = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "recent7", label: "최근 7일" },
  { key: "recent30", label: "최근 30일" },
] as const satisfies readonly DatePresetOption[];

export type DatePresetKey = (typeof DATE_PRESET_OPTIONS)[number]["key"];
export type DateFilterKey = "created";

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

export function buildFilterDateState(startDate: string, endDate: string) {
  const from = startDate ? parseDateParam(startDate) : undefined;
  const to = endDate ? parseDateParam(endDate) : undefined;
  const range = from || to ? { from: from ?? to, to: to ?? from } : undefined;

  return {
    range,
    label: formatDateRange(range),
  };
}

function formatDateValue(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return formatLocalDate(date);
}

export function labelHospitalEntryAllowStatus(status?: string | null) {
  if (status === "PENDING") return "신청";
  if (status === "REVIEWING") return "검수";
  if (status === "APPROVED") return "승인";
  if (status === "REJECTED") return "반려";
  return status || "-";
}

export function hospitalEntryAllowStatusColor(status?: string | null): BadgeColor {
  if (status === "APPROVED") return "success";
  if (status === "PENDING" || status === "REVIEWING") return "warning";
  if (status === "REJECTED") return "error";
  return "light";
}

function formatAddress(address?: string | null, addressDetail?: string | null) {
  return [address?.trim(), addressDetail?.trim()].filter(Boolean).join(" ") || "-";
}

function resolveAllowStatusCode(status?: HospitalEntryAllowStatusValue | null) {
  if (!status) return "";
  if (typeof status === "string") return status;
  return status.code?.trim() || "";
}

export function normalizeHospitalEntry(item: HospitalEntryApiItem): HospitalEntryRow {
  return {
    id: Number(item.id),
    requestedAt: formatDateValue(item.created_at),
    hospitalName: item.hospital_name?.trim() || "-",
    address: formatAddress(item.address, item.address_detail),
    ceoName: item.ceo_name?.trim() || "-",
    applicantName: item.applicant_name?.trim() || "-",
    allowStatus: resolveAllowStatusCode(item.allow_status),
  };
}

export function normalizeHospitalEntrySummary(summary: HospitalEntrySummaryApiResponse): HospitalEntrySummary {
  return {
    pending: Number(summary.pending_entries ?? 0),
    reviewing: Number(summary.reviewing_entries ?? 0),
    rejected: Number(summary.rejected_entries ?? 0),
    approved: Number(summary.approved_entries ?? 0),
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

export function parseHospitalEntriesTableState(searchParams: URLSearchParams) {
  const allowStatuses = (searchParams.get("allow_status") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const createdDateState = buildFilterDateState(startDate, endDate);

  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const allowedSortFields = new Set<SortField>([
    "id",
    "created_at",
    "hospital_name",
    "address",
    "ceo_name",
    "applicant_name",
    "allow_status",
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
      allowStatuses,
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

export function buildHospitalEntriesQuery({
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
}): HospitalEntriesQuery {
  const query: HospitalEntriesQuery = {
    sort: sortState.enabled ? sortState.field : DEFAULT_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_SORT.direction,
    per_page: perPage,
    page,
  };

  const trimmedSearch = searchKeyword.trim();
  if (trimmedSearch) query.q = trimmedSearch;
  if (appliedFilters.allowStatuses.length > 0) query.allow_status = appliedFilters.allowStatuses.join(",");
  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;

  return query;
}

export function buildHospitalEntriesQueryString(query: HospitalEntriesQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.allow_status) params.set("allow_status", query.allow_status);
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.sort !== DEFAULT_SORT.field) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_SORT.direction) params.set("direction", query.direction);
  if (query.page > 1) params.set("page", String(query.page));

  return params.toString();
}
