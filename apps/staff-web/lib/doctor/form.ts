import type { CategorySelectorSection, ExistingMediaItem, MediaCollectionConfig } from "@beaulab/ui-admin";

import { CATEGORY_DOMAINS, CATEGORY_USAGES } from "@/lib/common/category";
import {
  getDoctorMediaFilename,
  resolveDoctorMediaUrl,
  type DoctorDetailResponse,
  type DoctorMediaAsset,
} from "./detail";
export { DOCTOR_SPECIALIST_FIELD_OPTIONS } from "./list";

export type DoctorHospitalOption = {
  id: number;
  name: string;
  business_number?: string | null;
};

export type DoctorFormValues = {
  hospital_id: number | null;
  hospital_name: string;
  hospital_business_number: string;
  name: string;
  gender: string;
  position: string;
  career_started_at: string;
  license_number: string;
  specialist_field: string;
  status: string;
  allow_status: string;
  category_ids: number[];
  educations: string[];
  careers: string[];
  etc_contents: string[];
};

export type DoctorMediaField =
  | "profile_image"
  | "license_image"
  | "specialist_certificate_image";

export type DoctorFieldName = keyof DoctorFormValues | DoctorMediaField;
export type DoctorFormErrors = Partial<Record<DoctorFieldName, string>>;

export const MAX_DOCTOR_TEXT_ITEM_COUNT = 20;

export const INITIAL_DOCTOR_FORM: DoctorFormValues = {
  hospital_id: null,
  hospital_name: "",
  hospital_business_number: "",
  name: "",
  gender: "",
  position: "",
  career_started_at: "",
  license_number: "",
  specialist_field: "NONE",
  status: "SUSPENDED",
  allow_status: "PENDING",
  category_ids: [],
  educations: [],
  careers: [],
  etc_contents: [],
};

export const DOCTOR_CATEGORY_SECTIONS: CategorySelectorSection[] = [
  {
    key: "doctor-specialty",
    label: "진료분야",
    domain: CATEGORY_DOMAINS.HOSPITAL_MEDICAL,
    usage: CATEGORY_USAGES.HOSPITAL_DOCTOR_SUBJECT,
    searchPlaceholder: "진료분야명을 입력해주세요. (ex. 눈, 피부)",
  },
];

export const DOCTOR_GENDER_OPTIONS = [
  { value: "남", label: "남" },
  { value: "여", label: "여" },
] as const;

export const DOCTOR_POSITION_OPTIONS = [
  { value: "대표원장", label: "대표원장" },
  { value: "원장", label: "원장" },
] as const;

export const DOCTOR_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "정상" },
  { value: "SUSPENDED", label: "정지" },
  { value: "INACTIVE", label: "비활성" },
] as const;

export const DOCTOR_ALLOW_STATUS_OPTIONS = [
  { value: "PENDING", label: "검수신청" },
  { value: "APPROVED", label: "검수완료" },
  { value: "REJECTED", label: "검수반려" },
] as const;

export const DOCTOR_PROFILE_COLLECTIONS: readonly MediaCollectionConfig<"profile_image">[] = [
  {
    key: "profile_image",
    label: "프로필 사진",
    showLabel: false,
    accept: "image/jpeg,image/png,image/webp",
    multiple: false,
    maxFiles: 1,
    emptyText: "업로드한 프로필 이미지가 없습니다.",
    helperText: "jpg, png, webp / 최대 5MB / 1:1 비율",
  },
];

export const FIELD_FOCUS_ORDER: readonly DoctorFieldName[] = [
  "profile_image",
  "hospital_id",
  "name",
  "gender",
  "position",
  "status",
  "allow_status",
  "category_ids",
  "career_started_at",
  "license_number",
  "specialist_field",
  "license_image",
  "specialist_certificate_image",
  "careers",
  "educations",
  "etc_contents",
] as const;

const FIELD_NAMES: readonly DoctorFieldName[] = [
  "hospital_id",
  "hospital_name",
  "hospital_business_number",
  "name",
  "gender",
  "position",
  "career_started_at",
  "license_number",
  "specialist_field",
  "status",
  "allow_status",
  "category_ids",
  "educations",
  "careers",
  "etc_contents",
  "profile_image",
  "license_image",
  "specialist_certificate_image",
] as const;

export function isDoctorFieldName(value: string): value is DoctorFieldName {
  return (FIELD_NAMES as readonly string[]).includes(value);
}

export function normalizeDoctorErrorField(key: string): DoctorFieldName | null {
  if (key.startsWith("category_ids")) return "category_ids";
  if (key.startsWith("educations")) return "educations";
  if (key.startsWith("careers")) return "careers";
  if (key.startsWith("etc_contents")) return "etc_contents";
  if (key.startsWith("specialist_certificate_image")) return "specialist_certificate_image";
  if (isDoctorFieldName(key)) return key;
  return null;
}

export function extractDoctorFieldErrors(details: unknown): DoctorFormErrors {
  if (!details || typeof details !== "object" || !("errors" in details)) {
    return {};
  }

  const rawErrors = (details as { errors?: unknown }).errors;
  if (!rawErrors || typeof rawErrors !== "object") {
    return {};
  }

  const nextErrors: DoctorFormErrors = {};

  for (const [key, value] of Object.entries(rawErrors as Record<string, unknown>)) {
    const normalizedField = normalizeDoctorErrorField(key);
    if (!normalizedField) continue;

    if (Array.isArray(value)) {
      const firstMessage = value.find((item): item is string => typeof item === "string" && item.trim().length > 0);
      if (firstMessage) {
        nextErrors[normalizedField] = firstMessage;
      }
      continue;
    }

    if (typeof value === "string" && value.trim()) {
      nextErrors[normalizedField] = value.trim();
    }
  }

  return nextErrors;
}

export function sanitizeDoctorList(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean);
}

export function buildDoctorExistingFileItem(media?: DoctorMediaAsset | null): ExistingMediaItem | null {
  const url = resolveDoctorMediaUrl(media);
  if (!media || !url) return null;

  return {
    id: media.id ?? getDoctorMediaFilename(media),
    url,
    name: getDoctorMediaFilename(media),
    size: media.size ?? null,
    isImage: media.mime_type?.startsWith("image/") ?? /\.(png|jpe?g|webp|gif|svg)$/i.test(`${media.path ?? ""} ${media.url ?? ""}`),
  };
}

export function buildDoctorExistingFileItems(mediaList?: DoctorMediaAsset[] | null): ExistingMediaItem[] {
  return (mediaList ?? [])
    .map((media) => buildDoctorExistingFileItem(media))
    .filter((item): item is ExistingMediaItem => Boolean(item));
}

export function mapDoctorDetailToForm(detail: DoctorDetailResponse): DoctorFormValues {
  return {
    ...INITIAL_DOCTOR_FORM,
    hospital_id: detail.hospital_id,
    hospital_name: detail.hospital_name?.trim() ?? "",
    hospital_business_number: detail.hospital_business_number?.trim() ?? "",
    name: detail.name ?? "",
    gender: detail.gender?.trim() ?? "",
    position: detail.position?.trim() ?? "",
    career_started_at: detail.career_started_at ?? "",
    license_number: (detail.license_number ?? "").replace(/\D/g, ""),
    specialist_field: detail.specialist?.code?.trim() || INITIAL_DOCTOR_FORM.specialist_field,
    status: detail.status ?? INITIAL_DOCTOR_FORM.status,
    allow_status: detail.allow_status ?? INITIAL_DOCTOR_FORM.allow_status,
    category_ids: detail.categories?.map((category) => category.id) ?? [],
    educations: detail.educations ?? [],
    careers: detail.careers ?? [],
    etc_contents: detail.etc_contents ?? [],
  };
}

function validateDoctorBaseForm(form: DoctorFormValues): DoctorFormErrors {
  const nextErrors: DoctorFormErrors = {};

  if (!form.hospital_id) {
    nextErrors.hospital_id = "소속 병의원을 선택해 주세요.";
  }

  if (!form.name.trim()) {
    nextErrors.name = "의료진명을 입력해 주세요.";
  }

  if (!form.gender) {
    nextErrors.gender = "성별을 선택해 주세요.";
  }

  if (!form.position) {
    nextErrors.position = "직책을 선택해 주세요.";
  }

  if (form.category_ids.length === 0) {
    nextErrors.category_ids = "주요 시술 분야를 1개 이상 선택해 주세요.";
  }

  if (!form.license_number.trim()) {
    nextErrors.license_number = "의사면허 번호를 입력해 주세요.";
  }

  if (sanitizeDoctorList(form.careers).length > MAX_DOCTOR_TEXT_ITEM_COUNT) {
    nextErrors.careers = `경력사항은 최대 ${MAX_DOCTOR_TEXT_ITEM_COUNT}개까지 입력할 수 있습니다.`;
  }

  if (sanitizeDoctorList(form.etc_contents).length > MAX_DOCTOR_TEXT_ITEM_COUNT) {
    nextErrors.etc_contents = `활동사항은 최대 ${MAX_DOCTOR_TEXT_ITEM_COUNT}개까지 입력할 수 있습니다.`;
  }

  if (sanitizeDoctorList(form.educations).length > MAX_DOCTOR_TEXT_ITEM_COUNT) {
    nextErrors.educations = `학력사항은 최대 ${MAX_DOCTOR_TEXT_ITEM_COUNT}개까지 입력할 수 있습니다.`;
  }

  return nextErrors;
}

export function validateCreateDoctorForm({
  form,
  profileImage,
}: {
  form: DoctorFormValues;
  profileImage?: File | null;
}): DoctorFormErrors {
  const nextErrors = validateDoctorBaseForm(form);

  if (!form.status) {
    nextErrors.status = "운영 상태를 선택해 주세요.";
  }

  if (!form.allow_status) {
    nextErrors.allow_status = "검수 상태를 선택해 주세요.";
  }

  if (!profileImage) {
    nextErrors.profile_image = "프로필 사진을 등록해 주세요.";
  }

  return nextErrors;
}

export function validateUpdateDoctorForm({
  form,
  profileImage,
  existingProfileImage,
}: {
  form: DoctorFormValues;
  profileImage?: File | null;
  existingProfileImage?: ExistingMediaItem | null;
}): DoctorFormErrors {
  const nextErrors = validateDoctorBaseForm(form);

  if (!form.status) {
    nextErrors.status = "운영 상태를 선택해 주세요.";
  }

  if (!form.allow_status) {
    nextErrors.allow_status = "검수 상태를 선택해 주세요.";
  }

  if (!profileImage && !existingProfileImage) {
    nextErrors.profile_image = "프로필 사진을 등록해 주세요.";
  }

  return nextErrors;
}
