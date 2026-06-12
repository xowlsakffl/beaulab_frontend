import type { CategorySelectorSection } from "@beaulab/ui-admin";

import { CATEGORY_DOMAINS, CATEGORY_USAGES } from "@/lib/common/category";

export type HospitalEventType = "IMAGE" | "TEXT";
export type HospitalEventCategoryUsage = "HOSPITAL_EVENT_SURGERY" | "HOSPITAL_EVENT_TREATMENT";

export type HospitalEventDoctorAssignmentForm = {
  hospital_doctor_id: number | null;
  name: string;
  is_career_visible: boolean;
  is_activity_visible: boolean;
};

export type HospitalEventOptionForm = {
  name: string;
  session_count: string;
  normal_price: string;
  event_price: string;
};

export type HospitalEventFormValues = {
  hospital_id: number | null;
  hospital_name: string;
  hospital_business_number: string;
  category_ids: number[];
  primary_category_id: number | null;
  is_male_targeted: boolean;
  doctor_assignments: HospitalEventDoctorAssignmentForm[];
  event_type: HospitalEventType;
  name: string;
  description: string;
  event_start_at: string;
  event_end_at: string;
  is_event_period_unlimited: boolean;
  is_vat_included: boolean;
  normal_price: string;
  event_price: string;
  consultation_price: string;
  has_options: boolean;
  options: HospitalEventOptionForm[];
  procedure_targets: string[];
  procedure_benefits: string[];
  side_effect_notice: string;
};

export type HospitalEventFieldName =
  | keyof HospitalEventFormValues
  | "thumbnail_image"
  | "event_page_image";

export type HospitalEventFormErrors = Partial<Record<HospitalEventFieldName, string>>;

export const HOSPITAL_EVENT_PROCEDURE_TARGET_MAX_COUNT = 5;
export const HOSPITAL_EVENT_PROCEDURE_BENEFIT_MAX_COUNT = 6;

export const HOSPITAL_EVENT_CATEGORY_SECTIONS: CategorySelectorSection[] = [
  {
    key: "surgery",
    label: "성형",
    domain: CATEGORY_DOMAINS.HOSPITAL_MEDICAL,
    usage: CATEGORY_USAGES.HOSPITAL_EVENT_SURGERY,
    searchPlaceholder: "카테고리를 검색해 주세요. (ex. 눈, 코)",
  },
  {
    key: "treatment",
    label: "쁘띠",
    domain: CATEGORY_DOMAINS.HOSPITAL_MEDICAL,
    usage: CATEGORY_USAGES.HOSPITAL_EVENT_TREATMENT,
    searchPlaceholder: "카테고리를 검색해 주세요. (ex. 보톡스, 리프팅)",
  },
];

export const INITIAL_HOSPITAL_EVENT_FORM: HospitalEventFormValues = {
  hospital_id: null,
  hospital_name: "",
  hospital_business_number: "",
  category_ids: [],
  primary_category_id: null,
  is_male_targeted: false,
  doctor_assignments: [
    emptyDoctorAssignment(),
    emptyDoctorAssignment(),
    emptyDoctorAssignment(),
  ],
  event_type: "IMAGE",
  name: "",
  description: "",
  event_start_at: todayString(),
  event_end_at: "",
  is_event_period_unlimited: true,
  is_vat_included: true,
  normal_price: "",
  event_price: "",
  consultation_price: "",
  has_options: false,
  options: [emptyEventOption()],
  procedure_targets: [""],
  procedure_benefits: [""],
  side_effect_notice: "",
};

export const HOSPITAL_EVENT_FIELD_FOCUS_ORDER: readonly HospitalEventFieldName[] = [
  "hospital_id",
  "category_ids",
  "primary_category_id",
  "name",
  "description",
  "event_start_at",
  "event_end_at",
  "normal_price",
  "event_price",
  "consultation_price",
  "options",
  "procedure_targets",
  "procedure_benefits",
  "side_effect_notice",
  "thumbnail_image",
  "event_page_image",
];

const FIELD_NAMES: readonly HospitalEventFieldName[] = [
  "hospital_id",
  "hospital_name",
  "hospital_business_number",
  "category_ids",
  "primary_category_id",
  "is_male_targeted",
  "doctor_assignments",
  "event_type",
  "name",
  "description",
  "event_start_at",
  "event_end_at",
  "is_event_period_unlimited",
  "is_vat_included",
  "normal_price",
  "event_price",
  "consultation_price",
  "has_options",
  "options",
  "procedure_targets",
  "procedure_benefits",
  "side_effect_notice",
  "thumbnail_image",
  "event_page_image",
];

export function emptyDoctorAssignment(): HospitalEventDoctorAssignmentForm {
  return {
    hospital_doctor_id: null,
    name: "",
    is_career_visible: true,
    is_activity_visible: false,
  };
}

export function emptyEventOption(): HospitalEventOptionForm {
  return {
    name: "",
    session_count: "1",
    normal_price: "",
    event_price: "",
  };
}

export function todayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatNumberInput(value: string): string {
  const digits = onlyDigits(value);
  if (!digits) return "";

  return Number(digits).toLocaleString("ko-KR");
}

export function parseNumberInput(value: string): number {
  const digits = onlyDigits(value);
  return digits ? Number(digits) : 0;
}

export function calculateHospitalEventDiscountRate(normalPrice: number, eventPrice: number): number {
  if (normalPrice <= 0 || eventPrice <= 0) return 0;

  return Math.max(0, Math.round((1 - eventPrice / normalPrice) * 100));
}

export function calculateHospitalEventConsultationBasePrice(eventPrice: number): number {
  if (eventPrice <= 50000) return 10000;
  if (eventPrice <= 100000) return 12500;
  if (eventPrice <= 200000) return 15000;
  if (eventPrice <= 300000) return 17500;
  if (eventPrice <= 500000) return 20000;
  if (eventPrice <= 800000) return 22500;
  if (eventPrice <= 1000000) return 25000;
  if (eventPrice <= 1500000) return 27500;
  if (eventPrice <= 2500000) return 30000;
  if (eventPrice <= 3000000) return 32500;
  if (eventPrice <= 4000000) return 37500;

  return 40000;
}

export function normalizeHospitalEventErrorField(key: string): HospitalEventFieldName | null {
  if (key.startsWith("category_ids")) return "category_ids";
  if (key.startsWith("doctor_assignments")) return "doctor_assignments";
  if (key.startsWith("options")) return "options";
  if (key.startsWith("procedure_targets")) return "procedure_targets";
  if (key.startsWith("procedure_benefits")) return "procedure_benefits";
  if (key.startsWith("thumbnail_image")) return "thumbnail_image";
  if (key.startsWith("event_page_image")) return "event_page_image";
  if ((FIELD_NAMES as readonly string[]).includes(key)) return key as HospitalEventFieldName;

  return null;
}

export function extractHospitalEventFieldErrors(details: unknown): HospitalEventFormErrors {
  if (!details || typeof details !== "object" || !("errors" in details)) {
    return {};
  }

  const rawErrors = (details as { errors?: unknown }).errors;
  if (!rawErrors || typeof rawErrors !== "object") {
    return {};
  }

  const nextErrors: HospitalEventFormErrors = {};

  for (const [key, value] of Object.entries(rawErrors as Record<string, unknown>)) {
    const field = normalizeHospitalEventErrorField(key);
    if (!field) continue;

    if (Array.isArray(value)) {
      const firstMessage = value.find((item): item is string => typeof item === "string" && item.trim().length > 0);
      if (firstMessage) nextErrors[field] = firstMessage;
      continue;
    }

    if (typeof value === "string" && value.trim()) {
      nextErrors[field] = value.trim();
    }
  }

  return nextErrors;
}

export function validateCreateHospitalEventForm(
  form: HospitalEventFormValues,
  thumbnailImage: File | null,
  eventPageImage: File | null,
  selectedCategoryUsage: HospitalEventCategoryUsage | null,
): HospitalEventFormErrors {
  const errors: HospitalEventFormErrors = {};
  const normalPrice = parseNumberInput(form.normal_price);
  const eventPrice = parseNumberInput(form.event_price);
  const consultationPrice = parseNumberInput(form.consultation_price);
  const baseConsultationPrice = calculateHospitalEventConsultationBasePrice(eventPrice);

  if (!form.hospital_id) errors.hospital_id = "병의원을 선택해 주세요.";
  if (form.category_ids.length === 0) errors.category_ids = "카테고리를 1개 이상 선택해 주세요.";
  if (form.category_ids.length > 3) errors.category_ids = "카테고리는 최대 3개까지 선택할 수 있습니다.";
  if (!form.primary_category_id) errors.primary_category_id = "대표 카테고리를 선택해 주세요.";
  if (!form.name.trim()) errors.name = "이벤트명을 입력해 주세요.";
  if (!form.description.trim()) errors.description = "이벤트 설명을 입력해 주세요.";
  if (!form.event_start_at) errors.event_start_at = "시작일을 선택해 주세요.";
  if (!form.is_event_period_unlimited && !form.event_end_at) errors.event_end_at = "종료일을 선택해 주세요.";
  if (!normalPrice) errors.normal_price = "정상 가격을 입력해 주세요.";
  if (!eventPrice) errors.event_price = "이벤트 가격을 입력해 주세요.";
  if (normalPrice > 0 && eventPrice > normalPrice) errors.event_price = "이벤트 가격은 정상 가격을 초과할 수 없습니다.";
  if (normalPrice > 0 && eventPrice > 0 && eventPrice * 100 < normalPrice * 51) {
    errors.event_price = "할인율은 49%를 초과할 수 없습니다.";
  }
  if (consultationPrice > 0 && consultationPrice < baseConsultationPrice) {
    errors.consultation_price = "상담 신청 단가는 기준 단가보다 낮게 설정할 수 없습니다.";
  }
  if (!thumbnailImage) errors.thumbnail_image = "썸네일 이미지를 등록해 주세요.";
  if (form.event_type === "IMAGE" && !eventPageImage) errors.event_page_image = "이벤트 페이지 이미지를 등록해 주세요.";

  if (form.event_type === "IMAGE" && selectedCategoryUsage === "HOSPITAL_EVENT_TREATMENT" && form.has_options) {
    const validOptions = form.options.filter((option) => option.name.trim());
    if (validOptions.length === 0) errors.options = "이벤트 옵션을 1개 이상 입력해 주세요.";
  }

  if (form.event_type === "TEXT") {
    if (form.procedure_targets.filter((item) => item.trim()).length < 1) {
      errors.procedure_targets = "시술 대상은 1개 이상 입력해 주세요.";
    }

    if (form.procedure_targets.length > HOSPITAL_EVENT_PROCEDURE_TARGET_MAX_COUNT) {
      errors.procedure_targets = `시술 대상은 최대 ${HOSPITAL_EVENT_PROCEDURE_TARGET_MAX_COUNT}개까지 입력할 수 있습니다.`;
    }

    if (form.procedure_benefits.filter((item) => item.trim()).length < 1) {
      errors.procedure_benefits = "시술 장점은 1개 이상 입력해 주세요.";
    }
    if (form.procedure_benefits.length > HOSPITAL_EVENT_PROCEDURE_BENEFIT_MAX_COUNT) {
      errors.procedure_benefits = `시술 장점은 최대 ${HOSPITAL_EVENT_PROCEDURE_BENEFIT_MAX_COUNT}개까지 입력할 수 있습니다.`;
    }
  }

  return errors;
}

export function appendHospitalEventFormData(
  formData: FormData,
  form: HospitalEventFormValues,
  thumbnailImage: File,
  eventPageImage: File | null,
  selectedCategoryUsage: HospitalEventCategoryUsage | null,
) {
  formData.append("hospital_id", String(form.hospital_id ?? ""));
  formData.append("event_type", form.event_type);
  formData.append("is_male_targeted", form.is_male_targeted ? "1" : "0");
  formData.append("name", form.name.trim());
  formData.append("description", form.description.trim());
  formData.append("is_event_period_unlimited", form.is_event_period_unlimited ? "1" : "0");
  formData.append("event_start_at", form.event_start_at);
  if (!form.is_event_period_unlimited) {
    formData.append("event_end_at", form.event_end_at);
  }
  formData.append("normal_price", String(parseNumberInput(form.normal_price)));
  formData.append("event_price", String(parseNumberInput(form.event_price)));
  formData.append("is_vat_included", form.is_vat_included ? "1" : "0");
  const consultationPrice =
    parseNumberInput(form.consultation_price) || calculateHospitalEventConsultationBasePrice(parseNumberInput(form.event_price));
  formData.append("consultation_price", String(consultationPrice));
  formData.append("allow_status", "PENDING");
  formData.append("status", "INACTIVE");
  formData.append("side_effect_notice", form.side_effect_notice.trim());

  form.category_ids.forEach((categoryId) => {
    formData.append("category_ids[]", String(categoryId));
  });

  formData.append("primary_category_id", String(form.primary_category_id ?? ""));

  form.doctor_assignments
    .filter((assignment) => assignment.hospital_doctor_id)
    .forEach((assignment, index) => {
      formData.append(`doctor_assignments[${index}][hospital_doctor_id]`, String(assignment.hospital_doctor_id));
      formData.append(`doctor_assignments[${index}][sort_order]`, String(index));
      formData.append(`doctor_assignments[${index}][is_career_visible]`, assignment.is_career_visible ? "1" : "0");
      formData.append(`doctor_assignments[${index}][is_activity_visible]`, assignment.is_activity_visible ? "1" : "0");
    });

  const shouldSubmitOptions = form.event_type === "IMAGE" && selectedCategoryUsage === "HOSPITAL_EVENT_TREATMENT" && form.has_options;
  formData.append("has_options", shouldSubmitOptions ? "1" : "0");

  if (shouldSubmitOptions) {
    form.options
      .filter((option) => option.name.trim())
      .forEach((option, index) => {
        formData.append(`options[${index}][name]`, option.name.trim());
        formData.append(`options[${index}][session_count]`, String(Math.max(1, Number(onlyDigits(option.session_count)) || 1)));
        formData.append(`options[${index}][normal_price]`, String(parseNumberInput(option.normal_price)));
        formData.append(`options[${index}][event_price]`, String(parseNumberInput(option.event_price)));
        formData.append(`options[${index}][sort_order]`, String(index));
      });
  }

  if (form.event_type === "TEXT") {
    form.procedure_targets
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => formData.append("procedure_targets[]", item));
    form.procedure_benefits
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => formData.append("procedure_benefits[]", item));
  }

  formData.append("thumbnail_image", thumbnailImage);
  if (form.event_type === "IMAGE" && eventPageImage) {
    formData.append("event_page_image", eventPageImage);
  }
}
