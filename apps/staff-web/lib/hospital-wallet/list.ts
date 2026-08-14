import type { TemplateMessagePart, TemplateVariableOption } from "@beaulab/ui-admin";

export type HospitalWalletApiItem = {
  id: number;
  hospital?: {
    id: number;
    name?: string | null;
    is_deleted?: boolean | null;
  } | null;
  total_balance?: number | null;
  paid_balance?: number | null;
  owned_paid_balance?: number | null;
  reserved_paid_balance?: number | null;
  service_balance?: number | null;
  active_event_count?: number | null;
  active_ad_count?: number | null;
  last_transaction_at?: string | null;
};

export type HospitalWalletRow = {
  id: number;
  hospitalId: number;
  hospitalName: string;
  hospitalDeleted: boolean;
  totalBalance: number;
  paidBalance: number;
  ownedPaidBalance: number;
  reservedPaidBalance: number;
  serviceBalance: number;
  activeEventCount: number;
  activeAdCount: number;
  lastTransactionAt: string | null;
};

export type HospitalWalletServicePointTransactionApiItem = {
  id: number;
  hospital?: {
    id: number;
    name?: string | null;
  } | null;
  type: string;
  type_label?: string | null;
  amount: number;
  total_balance: number;
  paid_balance: number;
  service_balance: number;
  reason?: string | null;
  created_at?: string | null;
};

export type HospitalWalletServicePointResult = {
  batch_uuid: string;
  type: string;
  type_label?: string | null;
  processed_count: number;
  amount_per_hospital: number;
  total_amount: number;
  items: HospitalWalletServicePointTransactionApiItem[];
};

export type HospitalWalletServicePointMode = "grant" | "reclaim";
export type HospitalWalletBalanceChange = {
  mode: HospitalWalletServicePointMode | "refund";
  amount: number;
};

export type HospitalWalletRefundCreateResult = {
  refund: {
    operation_id: number;
    status: string;
    status_label?: string | null;
    points: number;
  };
  wallet: {
    hospital_id: number;
    total_balance: number;
    paid_balance: number;
    owned_paid_balance: number;
    reserved_paid_balance: number;
    service_balance: number;
  };
  direct_processed: boolean;
  replayed?: boolean;
};

export type HospitalWalletRefundSubmitPayload = {
  points: number;
  reason: string;
  bankName: string;
  accountNumber: string;
  businessRegistrationFile: File | null;
  bankbookFile: File | null;
};

export type HospitalWalletInsufficientHospital = {
  id: number;
  name: string;
  serviceBalance: number;
  requestedAmount: number;
};

export type HospitalWalletNoticeBatchApiItem = {
  id: number;
  status: string;
  status_label?: string | null;
  hospital_count?: number | null;
  recipient_count?: number | null;
  sent_count?: number | null;
  failed_count?: number | null;
  skipped_count?: number | null;
  deliveries?: Array<{
    status?: string | null;
    recipient_kind_labels?: string[] | null;
  }> | null;
  replayed?: boolean | null;
};

export type SortField =
  | "hospital_id"
  | "hospital_name"
  | "total_balance"
  | "paid_balance"
  | "service_balance"
  | "active_event_count"
  | "active_ad_count";
export type SortDirection = "asc" | "desc";

export type SortState = {
  field: SortField;
  direction: SortDirection;
};

export type HospitalWalletsQuery = {
  q?: string;
  sort: SortField;
  direction: SortDirection;
  per_page: number;
  page: number;
};

export const DEFAULT_SORT: SortState = {
  field: "hospital_id",
  direction: "desc",
};

export const DEFAULT_PER_PAGE = 15;

export const HOSPITAL_WALLET_NOTICE_SMS_MAX_BYTES = 90;
export const HOSPITAL_WALLET_NOTICE_VARIABLES: TemplateVariableOption[] = [
  { key: "HOSPITAL_NAME", label: "병의원명" },
  { key: "REMAINING_BALANCE", label: "잔여충전금" },
];
export const HOSPITAL_WALLET_NOTICE_DEFAULT_PARTS: TemplateMessagePart[] = [
  { type: "TEXT", text: "안녕하세요, 뷰랩입니다.\n" },
  { type: "VARIABLE", key: "HOSPITAL_NAME" },
  { type: "TEXT", text: "의 현재 충전금이 곧 소진될 예정이라 안내드립니다.\n\n[현재충전금 : " },
  { type: "VARIABLE", key: "REMAINING_BALANCE" },
  { type: "TEXT", text: "P]\n\n이용에 불편함이 없도록 미리 충전 부탁드립니다.\n감사합니다." },
];

const SORT_FIELDS = new Set<SortField>([
  "hospital_id",
  "hospital_name",
  "total_balance",
  "paid_balance",
  "service_balance",
  "active_event_count",
  "active_ad_count",
]);

function toNonNegativeInteger(value: number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
}

export function normalizeHospitalWallet(item: HospitalWalletApiItem): HospitalWalletRow {
  return {
    id: item.id,
    hospitalId: Number(item.hospital?.id ?? 0),
    hospitalName: item.hospital?.name?.trim() || "-",
    hospitalDeleted: Boolean(item.hospital?.is_deleted),
    totalBalance: toNonNegativeInteger(item.total_balance),
    paidBalance: toNonNegativeInteger(item.paid_balance),
    ownedPaidBalance: toNonNegativeInteger(item.owned_paid_balance ?? item.paid_balance),
    reservedPaidBalance: toNonNegativeInteger(item.reserved_paid_balance),
    serviceBalance: toNonNegativeInteger(item.service_balance),
    activeEventCount: toNonNegativeInteger(item.active_event_count),
    activeAdCount: toNonNegativeInteger(item.active_ad_count),
    lastTransactionAt: item.last_transaction_at ?? null,
  };
}

export function formatPoint(value: number) {
  return `${Math.trunc(value).toLocaleString("ko-KR")} P`;
}

const REFUND_VAT_PERCENT = 10;

export function calculateRefundAmount(points: number) {
  const supplyAmount = Math.max(0, Math.trunc(points));
  const vatAmount = Math.round((supplyAmount * REFUND_VAT_PERCENT) / 100);

  return {
    supplyAmount,
    vatAmount,
    totalAmount: supplyAmount + vatAmount,
  };
}

export function calculateRefundPoints(totalAmount: number) {
  return Math.max(0, Math.round(totalAmount / (1 + REFUND_VAT_PERCENT / 100)));
}

export function smsByteLength(value: string) {
  return Array.from(value).reduce((total, character) => total + (character.codePointAt(0)! <= 0x7f ? 1 : 2), 0);
}

export function cloneHospitalWalletNoticeMessageParts(parts: TemplateMessagePart[]) {
  return parts.map((part) => ({ ...part }));
}

export function renderHospitalWalletNoticeMessage(parts: TemplateMessagePart[], hospital: HospitalWalletRow) {
  return parts
    .map((part) => {
      if (part.type === "TEXT") return part.text;

      switch (part.key) {
        case "HOSPITAL_NAME":
          return hospital.hospitalName;
        case "REMAINING_BALANCE":
          return Math.trunc(hospital.totalBalance).toLocaleString("ko-KR");
        default:
          return "";
      }
    })
    .join("");
}

export function parseHospitalWalletInsufficientHospitals(details: unknown): HospitalWalletInsufficientHospital[] {
  if (!details || typeof details !== "object" || !("hospitals" in details)) return [];

  const hospitals = (details as { hospitals?: unknown }).hospitals;
  if (!Array.isArray(hospitals)) return [];

  return hospitals.flatMap((hospital) => {
    if (!hospital || typeof hospital !== "object") return [];

    const item = hospital as Record<string, unknown>;
    const id = Number(item.id ?? 0);
    if (!Number.isInteger(id) || id <= 0) return [];

    return [
      {
        id,
        name: typeof item.name === "string" && item.name.trim() ? item.name.trim() : "병의원",
        serviceBalance: Math.max(0, Number(item.service_balance ?? 0)),
        requestedAmount: Math.max(0, Number(item.requested_amount ?? 0)),
      },
    ];
  });
}

export function nextSortState(current: SortState, field: SortField): SortState {
  if (current.field !== field) {
    return { field, direction: "desc" };
  }

  return {
    field,
    direction: current.direction === "desc" ? "asc" : "desc",
  };
}

export function parseHospitalWalletsTableState(searchParams: URLSearchParams) {
  const sortParam = searchParams.get("sort");
  const parsedPerPage = Number(searchParams.get("per_page"));
  const parsedPage = Number(searchParams.get("page"));

  return {
    searchKeyword: searchParams.get("q")?.trim() ?? "",
    sortState: {
      field: sortParam && SORT_FIELDS.has(sortParam as SortField) ? (sortParam as SortField) : DEFAULT_SORT.field,
      direction: searchParams.get("direction") === "asc" ? ("asc" as const) : ("desc" as const),
    },
    perPage:
      Number.isFinite(parsedPerPage) && parsedPerPage >= 1 && parsedPerPage <= 100 ? parsedPerPage : DEFAULT_PER_PAGE,
    page: Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1,
  };
}

export function buildHospitalWalletsQuery({
  searchKeyword,
  sortState,
  perPage,
  page,
}: {
  searchKeyword: string;
  sortState: SortState;
  perPage: number;
  page: number;
}): HospitalWalletsQuery {
  const query: HospitalWalletsQuery = {
    sort: sortState.field,
    direction: sortState.direction,
    per_page: perPage,
    page,
  };
  const keyword = searchKeyword.trim();

  if (keyword) query.q = keyword;

  return query;
}

export function buildHospitalWalletsQueryString(query: HospitalWalletsQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.sort !== DEFAULT_SORT.field) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_SORT.direction) params.set("direction", query.direction);
  if (query.per_page !== DEFAULT_PER_PAGE) params.set("per_page", String(query.per_page));
  if (query.page !== 1) params.set("page", String(query.page));

  return params.toString();
}
