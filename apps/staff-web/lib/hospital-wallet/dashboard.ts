import type { DatePresetOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

export type WalletDashboardBalanceType = "ALL" | "PAID" | "SERVICE";

export type WalletDashboardMonthlyItem = {
  month: string;
  serviceGrantedPoints: number;
  serviceReclaimedPoints: number;
  chargedPoints: number;
  usedPoints: number;
  refundedPoints: number;
};

export type WalletDashboardCategoryShare = {
  categoryId: number;
  categoryName: string;
  applicationCount: number;
  ratio: number;
};

export type WalletDashboardOverview = {
  year: number;
  annual: {
    chargedPoints: number;
    usedPoints: number;
    refundedPoints: number;
  };
  balances: {
    totalPoints: number;
    paidPoints: number;
    servicePoints: number;
  };
  monthly: WalletDashboardMonthlyItem[];
  categoryShares: {
    surgery: WalletDashboardCategoryShare[];
    treatment: WalletDashboardCategoryShare[];
  };
};

export type WalletDashboardTopHospital = {
  rank: number;
  hospitalId: number;
  hospitalName: string;
  usedPoints: number;
};

export type WalletDashboardOverviewApiData = {
  year?: number;
  annual?: {
    charged_points?: number;
    used_points?: number;
    refunded_points?: number;
  };
  balances?: {
    total_points?: number;
    paid_points?: number;
    service_points?: number;
  };
  monthly?: Array<{
    month?: string;
    service_granted_points?: number;
    service_reclaimed_points?: number;
    charged_points?: number;
    used_points?: number;
    refunded_points?: number;
  }>;
  category_shares?: {
    surgery?: WalletDashboardCategoryShareApiItem[];
    treatment?: WalletDashboardCategoryShareApiItem[];
  };
};

type WalletDashboardCategoryShareApiItem = {
  category_id?: number;
  category_name?: string;
  application_count?: number;
  ratio?: number;
};

export type WalletDashboardTopHospitalsApiData = {
  items?: Array<{
    rank?: number;
    hospital_id?: number;
    hospital_name?: string;
    used_points?: number;
  }>;
};

export const WALLET_DASHBOARD_BALANCE_TYPES = [
  { value: "ALL", label: "전체" },
  { value: "PAID", label: "유상" },
  { value: "SERVICE", label: "무상" },
] as const;

export const WALLET_DASHBOARD_DATE_PRESETS = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "recent7", label: "최근 7일" },
  { key: "recent30", label: "최근 30일" },
] as const satisfies readonly DatePresetOption[];

export type WalletDashboardDatePresetKey = (typeof WALLET_DASHBOARD_DATE_PRESETS)[number]["key"];

export const WALLET_DASHBOARD_CHART_COLORS = [
  "#70BFA1",
  "#7F9CF5",
  "#F3B66F",
  "#EE8D87",
  "#A58BE2",
  "#78BDD1",
  "#E992BC",
  "#91A8DD",
  "#83B892",
  "#D9A06D",
  "#D98383",
  "#9C8BC7",
];

function nonNegativeInteger(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
}

function normalizeCategoryShare(item: WalletDashboardCategoryShareApiItem): WalletDashboardCategoryShare {
  return {
    categoryId: nonNegativeInteger(item.category_id),
    categoryName: item.category_name?.trim() || "미분류",
    applicationCount: nonNegativeInteger(item.application_count),
    ratio: Number.isFinite(Number(item.ratio)) ? Math.max(0, Number(item.ratio)) : 0,
  };
}

export function normalizeWalletDashboardOverview(data: WalletDashboardOverviewApiData): WalletDashboardOverview {
  return {
    year: nonNegativeInteger(data.year) || new Date().getFullYear(),
    annual: {
      chargedPoints: nonNegativeInteger(data.annual?.charged_points),
      usedPoints: nonNegativeInteger(data.annual?.used_points),
      refundedPoints: nonNegativeInteger(data.annual?.refunded_points),
    },
    balances: {
      totalPoints: nonNegativeInteger(data.balances?.total_points),
      paidPoints: nonNegativeInteger(data.balances?.paid_points),
      servicePoints: nonNegativeInteger(data.balances?.service_points),
    },
    monthly: (data.monthly ?? []).map((item) => ({
      month: item.month?.trim() || "-",
      serviceGrantedPoints: nonNegativeInteger(item.service_granted_points),
      serviceReclaimedPoints: nonNegativeInteger(item.service_reclaimed_points),
      chargedPoints: nonNegativeInteger(item.charged_points),
      usedPoints: nonNegativeInteger(item.used_points),
      refundedPoints: nonNegativeInteger(item.refunded_points),
    })),
    categoryShares: {
      surgery: (data.category_shares?.surgery ?? []).map(normalizeCategoryShare),
      treatment: (data.category_shares?.treatment ?? []).map(normalizeCategoryShare),
    },
  };
}

export function normalizeWalletDashboardTopHospitals(
  data: WalletDashboardTopHospitalsApiData,
): WalletDashboardTopHospital[] {
  return (data.items ?? []).map((item, index) => ({
    rank: nonNegativeInteger(item.rank) || index + 1,
    hospitalId: nonNegativeInteger(item.hospital_id),
    hospitalName: item.hospital_name?.trim() || "-",
    usedPoints: nonNegativeInteger(item.used_points),
  }));
}

export function formatWalletDashboardPoints(value: number) {
  return `${Math.max(0, Math.trunc(value)).toLocaleString("ko-KR")} P`;
}

export function formatWalletDashboardCompactPoints(value: number) {
  const normalized = Math.max(0, value);
  if (normalized >= 100_000_000) return `${Number((normalized / 100_000_000).toFixed(1))}억`;
  if (normalized >= 10_000) return `${Number((normalized / 10_000).toFixed(1))}만`;
  return Math.trunc(normalized).toLocaleString("ko-KR");
}

export function buildWalletDashboardDateRange(preset: WalletDashboardDatePresetKey): DateRange {
  const current = new Date();
  const today = new Date(current.getFullYear(), current.getMonth(), current.getDate());

  if (preset === "today") return { from: today, to: today };
  if (preset === "yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return { from: yesterday, to: yesterday };
  }

  const from = new Date(today);
  from.setDate(from.getDate() - (preset === "recent7" ? 6 : 29));
  return { from, to: today };
}

function localDate(value: Date) {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
}

function displayDate(value: Date) {
  return `${String(value.getFullYear() % 100).padStart(2, "0")}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function mapWalletDashboardDateRange(range?: DateRange) {
  if (!range?.from) return { label: "전체", startDate: "", endDate: "" };

  return {
    label: range.to ? `${displayDate(range.from)} ~ ${displayDate(range.to)}` : displayDate(range.from),
    startDate: localDate(range.from),
    endDate: range.to ? localDate(range.to) : "",
  };
}
