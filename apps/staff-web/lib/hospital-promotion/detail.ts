import type { ExistingMediaItem } from "@beaulab/ui-admin";
import { parseDateParam } from "@/lib/common/date-range-filter";
import { resolveMediaAssetUrl } from "@/lib/common/media";
import type { PromotionBanner, PromotionProgress } from "./types";

export function promotionTodayKst(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function getPromotionProgress(
  startDate: string,
  endDate: string,
  today = promotionTodayKst(),
): PromotionProgress | null {
  if (!parseDateParam(startDate) || !parseDateParam(endDate) || startDate > endDate) return null;
  if (today < startDate) return "UPCOMING";
  if (today > endDate) return "ENDED";
  return "CURRENT";
}

export function formatPromotionDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}`;
}

export function promotionBannerItem(banner?: PromotionBanner | null): ExistingMediaItem[] {
  const url = resolveMediaAssetUrl(banner);
  if (!banner || !url) return [];
  return [{ id: banner.id, url, name: banner.file_name || "배너 이미지", size: banner.size, isImage: true }];
}
