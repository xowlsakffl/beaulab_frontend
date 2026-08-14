import type { BadgeColor, DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

export type WalletOperationTypeGroup = "CHARGE" | "USAGE" | "REFUND" | "SERVICE" | "ALL";
export type WalletOperationStatus = "PENDING" | "COMPLETED" | "CANCELED" | "REJECTED" | "FAILED";
export type WalletOperationSortField = "id" | "created_at" | "amount";
export type SortDirection = "asc" | "desc";

export type WalletOperationApiItem = {
  id: number;
  transaction_id?: number | null;
  hospital?: { id: number; name?: string | null } | null;
  type?: string | null;
  type_label?: string | null;
  status?: string | null;
  status_label?: string | null;
  direction?: string | null;
  amount?: number | null;
  signed_amount?: number | null;
  reference?: { type?: string | null; id?: number | null; label?: string | null } | null;
  reason?: string | null;
  actor_label?: string | null;
  payment?: {
    payment_method?: string | null;
    provider?: string | null;
    depositor_name?: string | null;
    supply_amount?: number | null;
    vat_amount?: number | null;
    payment_amount?: number | null;
    paid_at?: string | null;
  } | null;
  refund?: {
    supply_amount?: number | null;
    vat_amount?: number | null;
    refund_amount?: number | null;
    has_business_registration_file?: boolean | null;
    has_bankbook_file?: boolean | null;
    rejection_reason?: string | null;
  } | null;
  created_at?: string | null;
  processed_at?: string | null;
};

export type WalletOperationRow = {
  id: number;
  transactionId: number | null;
  hospitalId: number | null;
  hospitalName: string;
  type: string;
  typeLabel: string;
  status: string;
  statusLabel: string;
  amount: number;
  signedAmount: number;
  referenceLabel: string;
  reason: string;
  actorLabel: string;
  depositorName: string;
  paymentAmount: number | null;
  refundAmount: number | null;
  hasBusinessRegistrationFile: boolean;
  hasBankbookFile: boolean;
  rejectionReason: string;
  createdAt: string;
};

export type WalletOperationFilters = {
  dateRange: string;
  startDate: string;
  endDate: string;
  statuses: WalletOperationStatus[];
};

export type WalletOperationSortState = {
  field: WalletOperationSortField;
  direction: SortDirection;
};

export type WalletOperationsQuery = {
  q?: string;
  type_group: WalletOperationTypeGroup;
  "statuses[]"?: WalletOperationStatus[];
  start_date?: string;
  end_date?: string;
  sort: WalletOperationSortField;
  direction: SortDirection;
  per_page: number;
  page: number;
};

export const WALLET_OPERATION_TABS = [
  { value: "CHARGE", label: "충전" },
  { value: "USAGE", label: "소진" },
  { value: "REFUND", label: "환불" },
  { value: "SERVICE", label: "서비스 적립/회수" },
  { value: "ALL", label: "전체" },
] as const;

export const CHARGE_STATUS_OPTIONS: { value: WalletOperationStatus; label: string }[] = [
  { value: "PENDING", label: "입금대기" },
  { value: "COMPLETED", label: "완료" },
  { value: "CANCELED", label: "취소" },
];

export const WALLET_OPERATION_DATE_PRESETS = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "recent7", label: "최근 7일" },
  { key: "recent30", label: "최근 30일" },
] as const satisfies readonly DatePresetOption[];

export type WalletOperationDatePresetKey = (typeof WALLET_OPERATION_DATE_PRESETS)[number]["key"];

export const DEFAULT_WALLET_OPERATION_FILTERS: WalletOperationFilters = {
  dateRange: "",
  startDate: "",
  endDate: "",
  statuses: [],
};

export const DEFAULT_WALLET_OPERATION_SORT: WalletOperationSortState = {
  field: "created_at",
  direction: "desc",
};

export const DEFAULT_WALLET_OPERATION_PER_PAGE = 15;

const TAB_VALUES = new Set<WalletOperationTypeGroup>(WALLET_OPERATION_TABS.map((item) => item.value));
const STATUS_VALUES = new Set<WalletOperationStatus>(CHARGE_STATUS_OPTIONS.map((item) => item.value));
const SORT_FIELDS = new Set<WalletOperationSortField>(["id", "created_at", "amount"]);

function parseListParam(value: string | null) {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function localDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function filterDate(value: Date) {
  return `${String(value.getFullYear() % 100).padStart(2, "0")}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function parseDateParam(value: string | null) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function normalizeWalletOperation(item: WalletOperationApiItem): WalletOperationRow {
  const amount = Math.max(0, Math.trunc(Number(item.amount ?? 0)));

  return {
    id: Number(item.id),
    transactionId: item.transaction_id ? Number(item.transaction_id) : null,
    hospitalId: item.hospital?.id ? Number(item.hospital.id) : null,
    hospitalName: item.hospital?.name?.trim() || "-",
    type: item.type?.trim() || "",
    typeLabel: item.type_label?.trim() || "-",
    status: item.status?.trim() || "",
    statusLabel: item.status_label?.trim() || "-",
    amount,
    signedAmount: Number.isFinite(Number(item.signed_amount)) ? Math.trunc(Number(item.signed_amount)) : amount,
    referenceLabel: item.reference?.label?.trim() || "-",
    reason: item.reason?.trim() || "-",
    actorLabel: item.actor_label?.trim() || "-",
    depositorName: item.payment?.depositor_name?.trim() || "-",
    paymentAmount: item.payment ? Math.max(0, Math.trunc(Number(item.payment.payment_amount ?? 0))) : null,
    refundAmount: item.refund ? Math.max(0, Math.trunc(Number(item.refund.refund_amount ?? 0))) : null,
    hasBusinessRegistrationFile: Boolean(item.refund?.has_business_registration_file),
    hasBankbookFile: Boolean(item.refund?.has_bankbook_file),
    rejectionReason: item.refund?.rejection_reason?.trim() || "-",
    createdAt: formatWalletOperationDateTime(item.created_at),
  };
}

export function formatWalletOperationDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return `${localDate(date)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}

export function formatWalletOperationPoint(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toLocaleString("ko-KR")} P`;
}

export function walletOperationStatusColor(status: string): BadgeColor {
  switch (status) {
    case "PENDING":
      return "blue";
    case "COMPLETED":
      return "green";
    case "CANCELED":
    case "REJECTED":
    case "FAILED":
      return "red";
    default:
      return "gray";
  }
}

export function buildWalletOperationPresetDateRange(preset: WalletOperationDatePresetKey): DateRange {
  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (preset === "today") return { from: normalizedToday, to: normalizedToday };
  if (preset === "yesterday") {
    const yesterday = new Date(normalizedToday);
    yesterday.setDate(yesterday.getDate() - 1);
    return { from: yesterday, to: yesterday };
  }

  const from = new Date(normalizedToday);
  from.setDate(from.getDate() - (preset === "recent7" ? 6 : 29));
  return { from, to: normalizedToday };
}

export function mapWalletOperationDateRange(
  range?: DateRange,
): Pick<WalletOperationFilters, "dateRange" | "startDate" | "endDate"> {
  if (!range?.from) return { dateRange: "", startDate: "", endDate: "" };

  return {
    dateRange: range.to ? `${filterDate(range.from)} ~ ${filterDate(range.to)}` : filterDate(range.from),
    startDate: localDate(range.from),
    endDate: range.to ? localDate(range.to) : "",
  };
}

export function parseWalletOperationsTableState(searchParams: URLSearchParams) {
  const tabParam = searchParams.get("tab") as WalletOperationTypeGroup | null;
  const sortParam = searchParams.get("sort") as WalletOperationSortField | null;
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const from = parseDateParam(startDate);
  const to = parseDateParam(endDate);
  const dateRange = from ? { from, to } : undefined;
  const parsedPage = Number(searchParams.get("page"));

  return {
    tab: tabParam && TAB_VALUES.has(tabParam) ? tabParam : ("CHARGE" as const),
    searchKeyword: searchParams.get("q")?.trim() ?? "",
    filters: {
      dateRange: dateRange ? mapWalletOperationDateRange(dateRange).dateRange : "",
      startDate,
      endDate,
      statuses: parseListParam(searchParams.get("status")).filter((value): value is WalletOperationStatus =>
        STATUS_VALUES.has(value as WalletOperationStatus),
      ),
    },
    draftDateRange: dateRange,
    sortState: {
      field: sortParam && SORT_FIELDS.has(sortParam) ? sortParam : DEFAULT_WALLET_OPERATION_SORT.field,
      direction: searchParams.get("direction") === "asc" ? ("asc" as const) : ("desc" as const),
    },
    page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
  };
}

export function buildWalletOperationsQuery({
  tab,
  searchKeyword,
  filters,
  sortState,
  page,
}: {
  tab: WalletOperationTypeGroup;
  searchKeyword: string;
  filters: WalletOperationFilters;
  sortState: WalletOperationSortState;
  page: number;
}): WalletOperationsQuery {
  const query: WalletOperationsQuery = {
    type_group: tab,
    sort: sortState.field,
    direction: sortState.direction,
    per_page: DEFAULT_WALLET_OPERATION_PER_PAGE,
    page,
  };

  if (searchKeyword.trim()) query.q = searchKeyword.trim();
  if (filters.startDate) query.start_date = filters.startDate;
  if (filters.endDate) query.end_date = filters.endDate;
  if (tab === "CHARGE" && filters.statuses.length > 0) query["statuses[]"] = filters.statuses;

  return query;
}

export function buildWalletOperationsQueryString(query: WalletOperationsQuery) {
  const params = new URLSearchParams();
  if (query.type_group !== "CHARGE") params.set("tab", query.type_group);
  if (query.q) params.set("q", query.q);
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query["statuses[]"]?.length) params.set("status", query["statuses[]"].join(","));
  if (query.sort !== DEFAULT_WALLET_OPERATION_SORT.field) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_WALLET_OPERATION_SORT.direction) params.set("direction", query.direction);
  if (query.page !== 1) params.set("page", String(query.page));
  return params.toString();
}

export function nextWalletOperationSortState(
  current: WalletOperationSortState,
  field: WalletOperationSortField,
): WalletOperationSortState {
  if (current.field !== field) return { field, direction: "desc" };
  return { field, direction: current.direction === "desc" ? "asc" : "desc" };
}
