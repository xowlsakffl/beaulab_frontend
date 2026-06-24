import type { BadgeColor, DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

export type HospitalEventDBOption<T extends string = string> = {
  value: T;
  label: string;
};

export type HospitalEventDBStatus = "NEW" | "CONFIRMED" | "DUPLICATE";
export type HospitalEventDBAllowStatus =
  | "UNVERIFIED_REPORTED"
  | "UNVERIFIED_CONFIRMED"
  | "NORMAL_CONFIRMED";
export type HospitalEventDBContactMethod = "KAKAO" | "PHONE" | "SMS";
export type HospitalEventDBPreferredTime = "MORNING" | "AFTERNOON" | "ANYTIME";
export type HospitalEventDBAmountMetric = "all" | "event_price" | "consultation_price";
export type HospitalEventDBSortDirection = "asc" | "desc";
export type HospitalEventDBSortField =
  | "id"
  | "event_price"
  | "consultation_price"
  | "status"
  | "allow_status"
  | "created_at"
  | "updated_at";

export type HospitalEventDBFilters = {
  accountUserId: string;
  hospitalId: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  contactMethod: string;
  preferredTime: string;
  amountMetric: HospitalEventDBAmountMetric;
  amountMin: string;
  amountMax: string;
  status: string;
  allowStatus: string;
};

export type HospitalEventDBSortState = {
  field: HospitalEventDBSortField;
  direction: HospitalEventDBSortDirection;
  enabled: boolean;
};

export type HospitalEventDBQuery = {
  q?: string;
  account_user_id?: string;
  hospital_id?: string;
  start_date?: string;
  end_date?: string;
  contact_methods?: string;
  preferred_times?: string;
  amount_metric?: HospitalEventDBAmountMetric;
  amount_min?: string;
  amount_max?: string;
  statuses?: string;
  allow_statuses?: string;
  sort: HospitalEventDBSortField;
  direction: HospitalEventDBSortDirection;
  per_page: number;
  page: number;
};

export type HospitalEventDBApiItem = {
  id?: number | null;
  hospital?: {
    id?: number | null;
    name?: string | null;
  } | null;
  event?: {
    id?: number | null;
    name?: string | null;
  } | null;
  doctor?: {
    id?: number | null;
    name?: string | null;
    position?: string | null;
  } | null;
  account_user?: {
    id?: number | null;
    nickname?: string | null;
    email?: string | null;
  } | null;
  name?: string | null;
  phone?: string | null;
  phone_normalized?: string | null;
  contact_method?: {
    code?: string | null;
    label?: string | null;
  } | null;
  preferred_time?: {
    code?: string | null;
    label?: string | null;
  } | null;
  event_price?: number | null;
  consultation_price?: number | null;
  status?: {
    code?: string | null;
    label?: string | null;
  } | null;
  allow_status?: {
    code?: string | null;
    label?: string | null;
  } | null;
  contacted_at?: string | null;
  confirmed_at?: string | null;
  duplicated_at?: string | null;
  author_ip?: string | null;
  user_agent?: string | null;
  privacy_agreed_at?: string | null;
  marketing_agreed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type HospitalEventDBRow = {
  id: number;
  createdAt: string;
  hospitalId: number | null;
  hospitalName: string;
  eventId: number | null;
  eventName: string;
  doctorId: number | null;
  doctorName: string;
  accountUserId: number | null;
  applicantName: string;
  phone: string;
  contactMethod: string;
  contactMethodLabel: string;
  preferredTime: string;
  preferredTimeLabel: string;
  eventPrice: number;
  consultationPrice: number;
  status: string;
  statusLabel: string;
  allowStatus: string;
  allowStatusLabel: string;
  authorIp: string;
};

export const HOSPITAL_EVENT_DBS_PER_PAGE = 15;

export const DEFAULT_HOSPITAL_EVENT_DB_FILTERS: HospitalEventDBFilters = {
  accountUserId: "",
  hospitalId: "",
  dateRange: "",
  startDate: "",
  endDate: "",
  contactMethod: "",
  preferredTime: "",
  amountMetric: "all",
  amountMin: "",
  amountMax: "",
  status: "",
  allowStatus: "",
};

export const DEFAULT_HOSPITAL_EVENT_DB_SORT: HospitalEventDBSortState = {
  field: "id",
  direction: "desc",
  enabled: true,
};

export const HOSPITAL_EVENT_DB_DATE_PRESET_OPTIONS = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "recent7", label: "최근 7일" },
  { key: "recent30", label: "최근 30일" },
] as const satisfies readonly DatePresetOption[];

export type HospitalEventDBDatePresetKey =
  (typeof HOSPITAL_EVENT_DB_DATE_PRESET_OPTIONS)[number]["key"];

export const HOSPITAL_EVENT_DB_CONTACT_METHOD_OPTIONS: HospitalEventDBOption[] = [
  { value: "", label: "전체" },
  { value: "KAKAO", label: "카카오톡" },
  { value: "PHONE", label: "전화" },
  { value: "SMS", label: "문자" },
];

export const HOSPITAL_EVENT_DB_PREFERRED_TIME_OPTIONS: HospitalEventDBOption[] = [
  { value: "", label: "전체" },
  { value: "MORNING", label: "오전" },
  { value: "AFTERNOON", label: "오후" },
  { value: "ANYTIME", label: "상시" },
];

export const HOSPITAL_EVENT_DB_AMOUNT_METRIC_OPTIONS: HospitalEventDBOption<HospitalEventDBAmountMetric>[] = [
  { value: "all", label: "전체" },
  { value: "event_price", label: "이벤트가격" },
  { value: "consultation_price", label: "소진단가" },
];

export const HOSPITAL_EVENT_DB_STATUS_OPTIONS: HospitalEventDBOption[] = [
  { value: "", label: "전체" },
  { value: "NEW", label: "신규" },
  { value: "CONFIRMED", label: "확인" },
  { value: "DUPLICATE", label: "중복" },
];

export const HOSPITAL_EVENT_DB_ALLOW_STATUS_OPTIONS: HospitalEventDBOption[] = [
  { value: "", label: "전체" },
  { value: "UNVERIFIED_REPORTED", label: "미인증DB 신고" },
  { value: "UNVERIFIED_CONFIRMED", label: "미인증DB 확정" },
  { value: "NORMAL_CONFIRMED", label: "정상DB 확정" },
];

const HOSPITAL_EVENT_DB_SORT_FIELDS = new Set<HospitalEventDBSortField>([
  "id",
  "event_price",
  "consultation_price",
  "status",
  "allow_status",
  "created_at",
  "updated_at",
]);

const CONTACT_METHOD_VALUES = new Set(HOSPITAL_EVENT_DB_CONTACT_METHOD_OPTIONS.map((option) => option.value));
const PREFERRED_TIME_VALUES = new Set(HOSPITAL_EVENT_DB_PREFERRED_TIME_OPTIONS.map((option) => option.value));
const STATUS_VALUES = new Set(HOSPITAL_EVENT_DB_STATUS_OPTIONS.map((option) => option.value));
const ALLOW_STATUS_VALUES = new Set(HOSPITAL_EVENT_DB_ALLOW_STATUS_OPTIONS.map((option) => option.value));
const AMOUNT_METRIC_VALUES = new Set(HOSPITAL_EVENT_DB_AMOUNT_METRIC_OPTIONS.map((option) => option.value));

export function labelHospitalEventDBStatus(status?: string | null) {
  switch (status) {
    case "NEW":
      return "신규";
    case "CONFIRMED":
      return "확인";
    case "DUPLICATE":
      return "중복";
    default:
      return "-";
  }
}

export function hospitalEventDBStatusColor(status?: string | null): BadgeColor {
  if (status === "CONFIRMED") return "gray";
  if (status === "DUPLICATE") return "warning";

  return "info";
}

export function labelHospitalEventDBAllowStatus(status?: string | null) {
  switch (status) {
    case "UNVERIFIED_REPORTED":
      return "미인증DB 신고";
    case "UNVERIFIED_CONFIRMED":
      return "미인증DB 확정";
    case "NORMAL_CONFIRMED":
      return "정상DB 확정";
    default:
      return "-";
  }
}

export function hospitalEventDBAllowStatusColor(status?: string | null): BadgeColor {
  if (status === "NORMAL_CONFIRMED") return "gray";
  if (status === "UNVERIFIED_CONFIRMED") return "purple";
  if (status === "UNVERIFIED_REPORTED") return "warning";

  return "light";
}

export function formatHospitalEventDBPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

export function formatHospitalEventDBDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${formatLocalDate(date)} ${hours}:${minutes}`;
}

export function normalizeHospitalEventDB(item: HospitalEventDBApiItem): HospitalEventDBRow {
  const status = item.status?.code?.trim() || "NEW";
  const allowStatus = item.allow_status?.code?.trim() || "";
  const contactMethod = item.contact_method?.code?.trim() || "";
  const preferredTime = item.preferred_time?.code?.trim() || "";

  return {
    id: Number(item.id ?? 0),
    createdAt: formatHospitalEventDBDateTime(item.created_at),
    hospitalId: normalizeNullableId(item.hospital?.id),
    hospitalName: item.hospital?.name?.trim() || "-",
    eventId: normalizeNullableId(item.event?.id),
    eventName: item.event?.name?.trim() || "-",
    doctorId: normalizeNullableId(item.doctor?.id),
    doctorName: item.doctor?.name?.trim() || "-",
    accountUserId: normalizeNullableId(item.account_user?.id),
    applicantName: item.name?.trim() || "-",
    phone: item.phone?.trim() || item.phone_normalized?.trim() || "-",
    contactMethod,
    contactMethodLabel: item.contact_method?.label?.trim() || labelContactMethod(contactMethod),
    preferredTime,
    preferredTimeLabel: item.preferred_time?.label?.trim() || labelPreferredTime(preferredTime),
    eventPrice: Number(item.event_price ?? 0),
    consultationPrice: Number(item.consultation_price ?? 0),
    status,
    statusLabel: item.status?.label?.trim() || labelHospitalEventDBStatus(status),
    allowStatus,
    allowStatusLabel: item.allow_status?.label?.trim() || labelHospitalEventDBAllowStatus(allowStatus),
    authorIp: item.author_ip?.trim() || "-",
  };
}

export function parseHospitalEventDBsTableState(searchParams: URLSearchParams) {
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const dateState = buildHospitalEventDBDateState(startDate, endDate);
  const amountMetric = searchParams.get("amount_metric");
  const sortFieldParam = searchParams.get("sort");
  const sortDirectionParam = searchParams.get("direction");
  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const sortField = sortFieldParam && HOSPITAL_EVENT_DB_SORT_FIELDS.has(sortFieldParam as HospitalEventDBSortField)
    ? (sortFieldParam as HospitalEventDBSortField)
    : DEFAULT_HOSPITAL_EVENT_DB_SORT.field;

  return {
    searchKeyword: searchParams.get("q")?.trim() ?? "",
    filters: {
      ...DEFAULT_HOSPITAL_EVENT_DB_FILTERS,
      accountUserId: normalizeIdParam(searchParams.get("account_user_id")),
      hospitalId: normalizeIdParam(searchParams.get("hospital_id")),
      dateRange: dateState.label,
      startDate,
      endDate,
      contactMethod: normalizeOptionValue(searchParams.get("contact_methods"), CONTACT_METHOD_VALUES),
      preferredTime: normalizeOptionValue(searchParams.get("preferred_times"), PREFERRED_TIME_VALUES),
      amountMetric: amountMetric && AMOUNT_METRIC_VALUES.has(amountMetric as HospitalEventDBAmountMetric)
        ? (amountMetric as HospitalEventDBAmountMetric)
        : "all",
      amountMin: normalizeNumberBound(searchParams.get("amount_min")),
      amountMax: normalizeNumberBound(searchParams.get("amount_max")),
      status: normalizeOptionValue(searchParams.get("statuses"), STATUS_VALUES),
      allowStatus: normalizeOptionValue(searchParams.get("allow_statuses"), ALLOW_STATUS_VALUES),
    },
    draftDateRange: dateState.range,
    sortState: {
      field: sortField,
      direction: sortDirectionParam === "asc" ? "asc" : "desc",
      enabled: Boolean(sortFieldParam || sortDirectionParam),
    } satisfies HospitalEventDBSortState,
    page,
  };
}

export function buildHospitalEventDBsQuery({
  searchKeyword,
  appliedFilters,
  sortState,
  page,
}: {
  searchKeyword: string;
  appliedFilters: HospitalEventDBFilters;
  sortState: HospitalEventDBSortState;
  page: number;
}): HospitalEventDBQuery {
  const query: HospitalEventDBQuery = {
    sort: sortState.enabled ? sortState.field : DEFAULT_HOSPITAL_EVENT_DB_SORT.field,
    direction: sortState.enabled ? sortState.direction : DEFAULT_HOSPITAL_EVENT_DB_SORT.direction,
    per_page: HOSPITAL_EVENT_DBS_PER_PAGE,
    page,
  };

  const q = searchKeyword.trim();
  const amountMin = normalizeNumberBound(appliedFilters.amountMin);
  const amountMax = normalizeNumberBound(appliedFilters.amountMax);

  if (q) query.q = q;
  if (appliedFilters.accountUserId) query.account_user_id = appliedFilters.accountUserId;
  if (appliedFilters.hospitalId) query.hospital_id = appliedFilters.hospitalId;
  if (appliedFilters.startDate) query.start_date = appliedFilters.startDate;
  if (appliedFilters.endDate) query.end_date = appliedFilters.endDate;
  if (appliedFilters.contactMethod) query.contact_methods = appliedFilters.contactMethod;
  if (appliedFilters.preferredTime) query.preferred_times = appliedFilters.preferredTime;
  if (amountMin || amountMax) {
    query.amount_metric = appliedFilters.amountMetric;
    if (amountMin) query.amount_min = amountMin;
    if (amountMax) query.amount_max = amountMax;
  }
  if (appliedFilters.status) query.statuses = appliedFilters.status;
  if (appliedFilters.allowStatus) query.allow_statuses = appliedFilters.allowStatus;

  return query;
}

export function buildHospitalEventDBsQueryString(query: HospitalEventDBQuery) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (key === "amount_metric" && value === "all" && !query.amount_min && !query.amount_max) return;
    if (key === "sort" && value === DEFAULT_HOSPITAL_EVENT_DB_SORT.field) return;
    if (key === "direction" && value === DEFAULT_HOSPITAL_EVENT_DB_SORT.direction) return;
    if (key === "per_page" && value === HOSPITAL_EVENT_DBS_PER_PAGE) return;
    if (key === "page" && value === 1) return;

    params.set(key, String(value));
  });

  return params.toString();
}

export function nextHospitalEventDBSortState(
  prev: HospitalEventDBSortState,
  field: HospitalEventDBSortField,
): HospitalEventDBSortState {
  if (prev.field !== field) return { field, direction: "desc", enabled: true };
  if (prev.direction === "desc") return { field, direction: "asc", enabled: true };

  return { ...DEFAULT_HOSPITAL_EVENT_DB_SORT, enabled: false };
}

export function mapDateRangeToHospitalEventDBFilter(range?: DateRange) {
  return {
    label: formatDateRange(range),
    startDate: range?.from ? formatLocalDate(range.from) : "",
    endDate: range?.to ? formatLocalDate(range.to) : "",
  };
}

export function buildHospitalEventDBPresetDateRange(preset: HospitalEventDBDatePresetKey): DateRange {
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

export function normalizeRangeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function normalizeNumberBound(value: string | null | undefined) {
  const trimmedValue = (value ?? "").trim();
  if (!/^\d+$/.test(trimmedValue)) return "";

  return trimmedValue.replace(/^0+(?=\d)/, "");
}

function labelContactMethod(value?: string | null) {
  return HOSPITAL_EVENT_DB_CONTACT_METHOD_OPTIONS.find((option) => option.value === value)?.label || "-";
}

function labelPreferredTime(value?: string | null) {
  return HOSPITAL_EVENT_DB_PREFERRED_TIME_OPTIONS.find((option) => option.value === value)?.label || "-";
}

function buildHospitalEventDBDateState(startDate: string, endDate: string) {
  const from = startDate ? parseDateParam(startDate) : undefined;
  const to = endDate ? parseDateParam(endDate) : undefined;
  const range = from || to ? { from: from ?? to, to: to ?? from } : undefined;

  return {
    range,
    label: formatDateRange(range),
  };
}

function formatDateRange(range?: DateRange) {
  if (!range?.from) return "";

  const fromDate = formatFilterDisplayDate(range.from);
  if (!range.to) return fromDate;

  return `${fromDate} ~ ${formatFilterDisplayDate(range.to)}`;
}

function formatFilterDisplayDate(date: Date) {
  const year = String(date.getFullYear() % 100).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeOptionValue(value: string | null | undefined, availableValues: Set<string>) {
  const firstValue = (value ?? "").split(",")[0]?.trim() ?? "";

  return availableValues.has(firstValue) ? firstValue : "";
}

function normalizeIdParam(value: string | null | undefined) {
  const normalized = (value ?? "").trim();

  return /^[1-9]\d*$/.test(normalized) ? normalized : "";
}

function normalizeNullableId(value: number | null | undefined) {
  const id = Number(value ?? 0);

  return Number.isInteger(id) && id > 0 ? id : null;
}
