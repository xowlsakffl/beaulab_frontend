import { CATEGORY_USAGES, type CategoryApiItem } from "@/lib/common/category";
import { formatEventAdLocalDate } from "@/lib/hospital-event-ad/list";

export type EventAdPlacementGroupKey = "main" | "surgery" | "petit" | "etc";

export type EventAdPlacementOption = {
  value: string;
  label: string;
  group_label: string;
  category_required: boolean;
  category_usage?: string | null;
  slot_limit: number;
};

export type EventAdAvailabilityWeek = {
  date: string;
  start_at: string;
  end_at: string;
  reserved_count: number;
  remaining_count: number;
  slot_limit: number;
  is_sold_out: boolean;
  is_past: boolean;
};

export type EventAdAvailabilityResponse = {
  placement: string;
  category_id?: number | null;
  month: string;
  weeks: EventAdAvailabilityWeek[];
};

export type EventAdCategoryOption = Pick<CategoryApiItem, "id" | "name" | "full_path" | "depth">;

export type EventAdHospitalEventOption = {
  id: number;
  name: string;
};

export type EventAdCreateFormValues = {
  hospital_id: number | null;
  hospital_name: string;
  hospital_business_number: string;
  hospital_event_id: number | null;
  cost: string;
};

export type EventAdCreateFormErrors = Partial<
  Record<"hospital_id" | "hospital_event_id" | "cost" | "ad_image_file", string>
>;

export const EVENT_AD_CREATE_FORM_ID = "hospital-event-ad-create-form";

export const INITIAL_EVENT_AD_CREATE_FORM: EventAdCreateFormValues = {
  hospital_id: null,
  hospital_name: "",
  hospital_business_number: "",
  hospital_event_id: null,
  cost: "0",
};

export const EVENT_AD_PLACEMENT_GROUPS: { key: EventAdPlacementGroupKey; label: string; values: string[] }[] = [
  {
    key: "main",
    label: "메인",
    values: ["MAIN_POPUP", "MAIN_VERTICAL_BANNER", "MAIN_HORIZONTAL_BANNER"],
  },
  {
    key: "surgery",
    label: "성형이벤트",
    values: ["SURGERY_TOP_BANNER", "SURGERY_HOT_EVENT", "SURGERY_CATEGORY_BANNER"],
  },
  {
    key: "petit",
    label: "쁘띠이벤트",
    values: ["PETIT_TOP_BANNER", "PETIT_HOT_EVENT", "PETIT_CATEGORY_BANNER"],
  },
  {
    key: "etc",
    label: "기타",
    values: ["CONSULT_MEMO", "SEARCH"],
  },
];

export const FALLBACK_EVENT_AD_PLACEMENT_OPTIONS: EventAdPlacementOption[] = [
  {
    value: "MAIN_POPUP",
    label: "메인 팝업",
    group_label: "메인",
    category_required: false,
    category_usage: null,
    slot_limit: 3,
  },
  {
    value: "MAIN_VERTICAL_BANNER",
    label: "메인 세로배너",
    group_label: "메인",
    category_required: false,
    category_usage: null,
    slot_limit: 3,
  },
  {
    value: "MAIN_HORIZONTAL_BANNER",
    label: "메인 가로배너",
    group_label: "메인",
    category_required: false,
    category_usage: null,
    slot_limit: 3,
  },
  {
    value: "SURGERY_TOP_BANNER",
    label: "성형 상단배너",
    group_label: "성형이벤트",
    category_required: false,
    category_usage: null,
    slot_limit: 3,
  },
  {
    value: "SURGERY_HOT_EVENT",
    label: "성형 HOT이벤트",
    group_label: "성형이벤트",
    category_required: false,
    category_usage: null,
    slot_limit: 3,
  },
  {
    value: "SURGERY_CATEGORY_BANNER",
    label: "성형 카테고리별 배너",
    group_label: "성형이벤트",
    category_required: true,
    category_usage: CATEGORY_USAGES.HOSPITAL_EVENT_AD_SURGERY,
    slot_limit: 3,
  },
  {
    value: "PETIT_TOP_BANNER",
    label: "쁘띠 상단배너",
    group_label: "쁘띠이벤트",
    category_required: false,
    category_usage: null,
    slot_limit: 3,
  },
  {
    value: "PETIT_HOT_EVENT",
    label: "쁘띠 HOT이벤트",
    group_label: "쁘띠이벤트",
    category_required: false,
    category_usage: null,
    slot_limit: 3,
  },
  {
    value: "PETIT_CATEGORY_BANNER",
    label: "쁘띠 카테고리별 배너",
    group_label: "쁘띠이벤트",
    category_required: true,
    category_usage: CATEGORY_USAGES.HOSPITAL_EVENT_AD_PETIT,
    slot_limit: 3,
  },
  {
    value: "CONSULT_MEMO",
    label: "상담메모장",
    group_label: "기타",
    category_required: false,
    category_usage: null,
    slot_limit: 3,
  },
  {
    value: "SEARCH",
    label: "검색창",
    group_label: "기타",
    category_required: false,
    category_usage: null,
    slot_limit: 3,
  },
];

export function normalizeEventAdPlacementOptions(items: EventAdPlacementOption[]) {
  const fallbackByValue = new Map(FALLBACK_EVENT_AD_PLACEMENT_OPTIONS.map((item) => [item.value, item]));

  return items.map((item) => ({
    ...item,
    label: item.label?.trim() || fallbackByValue.get(item.value)?.label || item.value,
    group_label: item.group_label?.trim() || fallbackByValue.get(item.value)?.group_label || "-",
    category_usage: item.category_usage ?? fallbackByValue.get(item.value)?.category_usage ?? null,
    slot_limit: Number(item.slot_limit || fallbackByValue.get(item.value)?.slot_limit || 3),
  }));
}

export function monthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return Number.isFinite(date.getTime()) ? date : null;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);

  return next;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function buildCalendarDays(monthDate: Date) {
  const firstDay = startOfMonth(monthDate);
  const firstGridDay = addDays(firstDay, -firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => addDays(firstGridDay, index));
}

export function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isDateInRange(date: Date, start: Date, end: Date) {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  return target >= start.getTime() && target <= end.getTime();
}

export function isCurrentOrNextMonth(monthDate: Date, direction: "prev" | "next") {
  const currentMonth = startOfMonth(new Date());
  const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  const target =
    direction === "prev"
      ? new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1)
      : new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);

  return isSameMonth(target, currentMonth) || isSameMonth(target, nextMonth);
}

export function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function formatEventAdMonthLabel(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

export function formatEventAdPeriodLabel(week: EventAdAvailabilityWeek | null) {
  if (!week) return "-";

  return `${week.date} 11:00 ~ ${formatEventAdLocalDate(addDays(parseDateKey(week.date) ?? new Date(), 7))} 10:59`;
}

export function validateEventAdCreateForm(form: EventAdCreateFormValues, adImageFile: File | null) {
  const errors: EventAdCreateFormErrors = {};
  const cost = Number(form.cost);

  if (!form.hospital_id) {
    errors.hospital_id = "병의원을 선택해 주세요.";
  }

  if (!form.hospital_event_id) {
    errors.hospital_event_id = "이벤트를 선택해 주세요.";
  }

  if (!Number.isFinite(cost) || cost < 0) {
    errors.cost = "비용은 0 이상의 숫자로 입력해 주세요.";
  }

  if (adImageFile && !["image/jpeg", "image/png"].includes(adImageFile.type)) {
    errors.ad_image_file = "광고 이미지는 jpg, jpeg, png 파일만 업로드할 수 있습니다.";
  }

  return errors;
}

export function buildEventAdCreateFormData({
  form,
  selectedPlacement,
  selectedCategory,
  selectedWeek,
  adImageFile,
  managerStaffId,
}: {
  form: EventAdCreateFormValues;
  selectedPlacement: EventAdPlacementOption;
  selectedCategory: EventAdCategoryOption | null;
  selectedWeek: EventAdAvailabilityWeek;
  adImageFile: File | null;
  managerStaffId?: number | null;
}) {
  const formData = new FormData();

  formData.append("hospital_id", String(form.hospital_id ?? ""));
  formData.append("hospital_event_id", String(form.hospital_event_id ?? ""));
  formData.append("placement", selectedPlacement.value);
  formData.append("cost", String(Number(form.cost) || 0));
  formData.append("start_date", selectedWeek.date);

  if (managerStaffId) {
    formData.append("manager_staff_id", String(managerStaffId));
  }

  if (selectedPlacement.category_required && selectedCategory) {
    formData.append("category_id", String(selectedCategory.id));
  }

  if (adImageFile) {
    formData.append("ad_image_file", adImageFile);
  }

  return formData;
}
