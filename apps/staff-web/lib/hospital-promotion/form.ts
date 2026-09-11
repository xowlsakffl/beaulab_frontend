import { parseDateParam } from "@/lib/common/date-range-filter";
import { isAllowedImageFileType } from "@/lib/common/media-validation";
import { promotionTodayKst } from "./detail";
import { promotionPositionOption, PROMOTION_STATUS_OPTIONS } from "./options";
import type { HospitalPromotionDetail, PromotionAvailability, PromotionScheduleConflict } from "./types";

export type PromotionFormValues = {
  title: string;
  content: string;
  side: string;
  slot: string;
  start_date: string;
  end_date: string;
  status: string;
};
export type PromotionFieldName = keyof PromotionFormValues | "banner";
export type PromotionFormErrors = Partial<Record<PromotionFieldName, string>>;
export const PROMOTION_FIELD_FOCUS_ORDER: readonly PromotionFieldName[] = [
  "title",
  "side",
  "slot",
  "start_date",
  "end_date",
  "status",
  "banner",
  "content",
];
export const INITIAL_PROMOTION_FORM: PromotionFormValues = {
  title: "",
  content: "",
  side: "",
  slot: "",
  start_date: "",
  end_date: "",
  status: "INACTIVE",
};
export const PROMOTION_CONFLICT_MESSAGE = "일정이 겹치는 프로모션이 있습니다. 확인 바랍니다.";
export const PROMOTION_PAST_START_DATE_MESSAGE = "게시 시작일은 오늘 이후로 선택해 주세요.";
export const PROMOTION_BANNER_RULE = {
  allowedExtensions: [".png", ".jpg", ".jpeg", ".webp"],
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  maxBytes: 10 * 1024 * 1024,
};
export const PROMOTION_BANNER_ACCEPT = "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";
export const PROMOTION_BANNER_HELPER_TEXT = "PNG, JPG, JPEG, WEBP / 10MB";

export function validatePromotionBanner(file: File): string | null {
  if (!isAllowedImageFileType(file, PROMOTION_BANNER_RULE)) return "PNG, JPG, JPEG, WEBP 이미지를 선택해 주세요.";
  if (file.size === 0) return "비어 있는 파일은 등록할 수 없습니다.";
  if (file.size > PROMOTION_BANNER_RULE.maxBytes) return "배너 이미지는 10MB 이하로 등록해 주세요.";
  return null;
}

export function mapPromotionDetailToForm(detail: HospitalPromotionDetail): PromotionFormValues {
  return {
    title: detail.title,
    content: detail.content,
    side: detail.side,
    slot: String(detail.slot),
    start_date: detail.start_date,
    end_date: detail.end_date,
    status: detail.status,
  };
}

export function validatePromotionForm(
  form: PromotionFormValues,
  banner: File | null,
  hasExistingBanner = false,
  minStartDate: string | null = promotionTodayKst(),
): PromotionFormErrors {
  const errors: PromotionFormErrors = {};
  if (!form.title.trim()) errors.title = "프로모션명을 입력해 주세요.";
  else if (Array.from(form.title.trim()).length > 255) errors.title = "프로모션명은 255자 이하로 입력해 주세요.";
  if (!promotionPositionOption(form.side, form.slot)) errors.side = "게시위치를 선택해 주세요.";
  if (!parseDateParam(form.start_date)) errors.start_date = "게시 시작일을 선택해 주세요.";
  else if (minStartDate && form.start_date < minStartDate) errors.start_date = PROMOTION_PAST_START_DATE_MESSAGE;
  if (!parseDateParam(form.end_date)) errors.end_date = "게시 종료일을 선택해 주세요.";
  if (!errors.start_date && !errors.end_date && form.start_date > form.end_date)
    errors.end_date = "종료일은 시작일 이후로 선택해 주세요.";
  if (!PROMOTION_STATUS_OPTIONS.some((option) => option.value === form.status))
    errors.status = "공개여부를 선택해 주세요.";
  const text = form.content
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;|&#x0*a0;/gi, " ")
    .trim();
  if (!text && !/<img\b[^>]*\bsrc\s*=/i.test(form.content)) errors.content = "내용을 입력해 주세요.";
  if (!banner && !hasExistingBanner) errors.banner = "배너 이미지를 등록해 주세요.";
  if (banner) {
    const message = validatePromotionBanner(banner);
    if (message) errors.banner = message;
  }
  return errors;
}

export function extractPromotionFieldErrors(details: unknown): PromotionFormErrors {
  if (!details || typeof details !== "object") return {};
  const raw = "errors" in details ? details.errors : details;
  if (!raw || typeof raw !== "object") return {};
  const errors: PromotionFormErrors = {};
  for (const [key, value] of Object.entries(raw)) {
    const field = key.split(".")[0] as PromotionFieldName;
    if (!PROMOTION_FIELD_FOCUS_ORDER.includes(field)) continue;
    const message = Array.isArray(value) ? value.find((item) => typeof item === "string" && item.trim()) : value;
    if (typeof message === "string" && message.trim()) errors[field] = message;
  }
  return errors;
}

export function extractPromotionAvailability(details: unknown): PromotionAvailability | null {
  if (!details || typeof details !== "object" || !("availability" in details)) return null;
  const value = details.availability;
  if (
    !value ||
    typeof value !== "object" ||
    !("available" in value) ||
    typeof value.available !== "boolean" ||
    !("has_more" in value) ||
    typeof value.has_more !== "boolean" ||
    !("conflicts" in value) ||
    !Array.isArray(value.conflicts)
  )
    return null;
  const conflicts = value.conflicts.filter(
    (item): item is PromotionScheduleConflict =>
      item !== null &&
      typeof item === "object" &&
      Number.isSafeInteger(item.id) &&
      item.id > 0 &&
      typeof item.title === "string" &&
      ["LEFT", "RIGHT"].includes(item.side) &&
      [1, 2, 3].includes(item.slot) &&
      typeof item.start_date === "string" &&
      Boolean(parseDateParam(item.start_date)) &&
      typeof item.end_date === "string" &&
      Boolean(parseDateParam(item.end_date)),
  );
  return { available: value.available, conflicts, has_more: value.has_more };
}

export function promotionSaveErrorMessage(details: unknown, fallback: string) {
  if (!details || typeof details !== "object") return fallback;
  const raw = "errors" in details ? details.errors : details;
  if (!raw || typeof raw !== "object") return fallback;
  const messages = Object.entries(raw).flatMap(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    return values
      .filter((message): message is string => typeof message === "string" && Boolean(message.trim()))
      .map((message) => ({ key, message }));
  });
  const stale = messages.find(({ key }) => key === "expected_updated_at");
  if (stale) return stale.message;
  if (messages.some(({ message }) => message.includes(PROMOTION_CONFLICT_MESSAGE))) return PROMOTION_CONFLICT_MESSAGE;
  return messages[0]?.message ?? fallback;
}

export function buildPromotionFormData({
  form,
  banner,
  includeStatus,
  detail,
}: {
  form: PromotionFormValues;
  banner: File | null;
  includeStatus: boolean;
  detail?: HospitalPromotionDetail;
}) {
  const data = new FormData();
  if (detail) {
    data.append("_method", "PATCH");
    data.append("expected_updated_at", detail.updated_at);
  }
  for (const [key, value] of Object.entries(form)) {
    if (key === "status" && !includeStatus) continue;
    data.append(key, key === "title" || key === "content" ? value.trim() : value);
  }
  if (banner) data.append("banner", banner);
  return data;
}

export function promotionFormChanged(form: PromotionFormValues, initial: PromotionFormValues) {
  return (Object.keys(initial) as (keyof PromotionFormValues)[]).some(
    (key) => form[key].trim() !== initial[key].trim(),
  );
}
