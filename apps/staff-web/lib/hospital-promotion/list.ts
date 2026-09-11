import { parseDateParam } from "@/lib/common/date-range-filter";
import type { PromotionStatus } from "./types";

export type PromotionTab = "active" | "ended";
export type PromotionFilters = {
  q: string;
  statuses: PromotionStatus[];
  start_date: string;
  end_date: string;
};
export type PromotionListQuery = PromotionFilters & {
  tab: PromotionTab;
  left_page: number;
  right_page: number;
  page: number;
};

export const EMPTY_PROMOTION_FILTERS: PromotionFilters = {
  q: "",
  statuses: [],
  start_date: "",
  end_date: "",
};

export function promotionFilters(query: PromotionFilters): PromotionFilters {
  return { q: query.q, statuses: [...query.statuses], start_date: query.start_date, end_date: query.end_date };
}

const parsePage = (value: string | null) => {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
};

export function parsePromotionListQuery(params: URLSearchParams): PromotionListQuery {
  const statuses = Array.from(
    new Set(
      (params.get("status") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter((value): value is PromotionStatus => value === "ACTIVE" || value === "INACTIVE"),
    ),
  );
  const from = params.get("start_date") ?? "";
  const to = params.get("end_date") ?? "";
  const validRange = !from || !to || from <= to;
  return {
    tab: params.get("tab") === "ended" ? "ended" : "active",
    q: (params.get("q") ?? "").trim().slice(0, 100),
    statuses,
    start_date: validRange && parseDateParam(from) ? from : "",
    end_date: validRange && parseDateParam(to) ? to : "",
    left_page: parsePage(params.get("left_page")),
    right_page: parsePage(params.get("right_page")),
    page: parsePage(params.get("page")),
  };
}

export function promotionListSearch(query: PromotionListQuery) {
  const params = new URLSearchParams();
  if (query.tab === "ended") params.set("tab", query.tab);
  if (query.statuses.length) params.set("status", query.statuses.join(","));
  for (const key of ["q", "start_date", "end_date"] as const) {
    if (query[key]) params.set(key, query[key]);
  }
  const pageKeys = query.tab === "active" ? (["left_page", "right_page"] as const) : (["page"] as const);
  for (const key of pageKeys) {
    if (query[key] > 1) params.set(key, String(query[key]));
  }
  return params.toString();
}

export function promotionListApiQuery(query: PromotionListQuery) {
  return {
    q: query.q || undefined,
    status: query.statuses.length ? query.statuses.join(",") : undefined,
    start_date: query.start_date || undefined,
    end_date: query.end_date || undefined,
    ...(query.tab === "active" ? { left_page: query.left_page, right_page: query.right_page } : { page: query.page }),
  };
}

export function promotionPeriod(start: string, end: string) {
  return `${start.replaceAll("-", ".")} ~ ${end.replaceAll("-", ".")}`;
}
