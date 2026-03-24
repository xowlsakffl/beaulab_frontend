import type { CategorySelectorSection, ExistingMediaItem, MediaCollectionConfig } from "@beaulab/ui-admin";

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
  is_specialist: boolean;
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
  | "specialist_certificate_image"
  | "education_certificate_image"
  | "etc_certificate_image";

export type DoctorFieldName = keyof DoctorFormValues | DoctorMediaField;
export type DoctorFormErrors = Partial<Record<DoctorFieldName, string>>;

export type DoctorMediaAsset = {
  id?: number | string;
  path?: string | null;
  url?: string | null;
  mime_type?: string | null;
  size?: number | null;
};

export type DoctorCategoryItem = {
  id: number;
  domain?: string | null;
  name: string;
  full_path?: string | null;
  is_primary?: boolean;
};

export type DoctorDetailResponse = {
  id: number;
  hospital_id: number;
  hospital_name?: string | null;
  hospital_business_number?: string | null;
  name: string;
  gender?: string | null;
  position?: string | null;
  career_started_at?: string | null;
  license_number?: string | null;
  is_specialist?: boolean | null;
  status?: string | null;
  allow_status?: string | null;
  educations?: string[] | null;
  careers?: string[] | null;
  etc_contents?: string[] | null;
  categories?: DoctorCategoryItem[] | null;
  profile_image?: DoctorMediaAsset | null;
  license_image?: DoctorMediaAsset | null;
  specialist_certificate_image?: DoctorMediaAsset | null;
  education_certificate_image?: DoctorMediaAsset[] | null;
  etc_certificate_image?: DoctorMediaAsset[] | null;
  view_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export const INITIAL_DOCTOR_FORM: DoctorFormValues = {
  hospital_id: null,
  hospital_name: "",
  hospital_business_number: "",
  name: "",
  gender: "",
  position: "",
  career_started_at: "",
  license_number: "",
  is_specialist: false,
  status: "SUSPENDED",
  allow_status: "PENDING",
  category_ids: [],
  educations: [],
  careers: [],
  etc_contents: [],
};

export const DOCTOR_CATEGORY_SECTIONS: CategorySelectorSection[] = [
  {
    key: "surgery",
    label: "성형",
    domain: "HOSPITAL_SURGERY",
    searchPlaceholder: "카테고리명을 입력해주세요. (ex. 눈, 코)",
  },
  {
    key: "treatment",
    label: "쁘띠/피부",
    domain: "HOSPITAL_TREATMENT",
    searchPlaceholder: "카테고리명을 입력해주세요. (ex. 인모드)",
  },
];

export const DOCTOR_GENDER_OPTIONS = [
  { value: "남", label: "남" },
  { value: "여", label: "여" },
] as const;

export const DOCTOR_POSITION_OPTIONS = [
  { value: "대표원장", label: "대표원장" },
  { value: "원장", label: "원장" },
  { value: "기타", label: "기타" },
] as const;

export const DOCTOR_SPECIALIST_OPTIONS = [
  { value: true, label: "예" },
  { value: false, label: "아니오" },
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
    helperText: "jpg, png, webp / 최대 8MB",
  },
];

export const FIELD_FOCUS_ORDER: readonly DoctorFieldName[] = [
  "hospital_id",
  "name",
  "gender",
  "position",
  "status",
  "allow_status",
  "category_ids",
  "career_started_at",
  "license_number",
  "profile_image",
  "license_image",
  "specialist_certificate_image",
  "education_certificate_image",
  "careers",
  "educations",
  "etc_contents",
  "etc_certificate_image",
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
  "is_specialist",
  "status",
  "allow_status",
  "category_ids",
  "educations",
  "careers",
  "etc_contents",
  "profile_image",
  "license_image",
  "specialist_certificate_image",
  "education_certificate_image",
  "etc_certificate_image",
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
  if (key.startsWith("education_certificate_image")) return "education_certificate_image";
  if (key.startsWith("etc_certificate_image")) return "etc_certificate_image";
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

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export function resolveDoctorMediaUrl(media?: DoctorMediaAsset | null): string | null {
  const rawUrl = media?.url?.trim();
  if (rawUrl) return rawUrl;

  const rawPath = media?.path?.trim();
  if (!rawPath) return null;
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  if (!API_BASE_URL) return rawPath;
  if (rawPath.startsWith("/storage/")) return `${API_BASE_URL}${rawPath}`;
  if (rawPath.startsWith("storage/")) return `${API_BASE_URL}/${rawPath}`;
  if (rawPath.startsWith("/")) return `${API_BASE_URL}${rawPath}`;

  return `${API_BASE_URL}/storage/${rawPath}`;
}

export function getDoctorMediaFilename(media?: DoctorMediaAsset | null) {
  if (!media) return "";

  const rawPath = media.path?.trim();
  if (rawPath) {
    const fileName = rawPath.split("/").filter(Boolean).pop();
    if (fileName) return fileName;
  }

  const rawUrl = media.url?.trim();
  if (rawUrl) {
    const cleanUrl = rawUrl.split("?")[0];
    const fileName = cleanUrl.split("/").filter(Boolean).pop();
    if (fileName) return fileName;
  }

  return `doctor-media-${media.id ?? "file"}`;
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
    license_number: detail.license_number ?? "",
    is_specialist: Boolean(detail.is_specialist),
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
    nextErrors.hospital_id = "소속 병원을 선택해 주세요.";
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

  return nextErrors;
}

export function validateCreateDoctorForm({
  form,
}: {
  form: DoctorFormValues;
}): DoctorFormErrors {
  const nextErrors = validateDoctorBaseForm(form);

  if (!form.status) {
    nextErrors.status = "운영상태를 선택해 주세요.";
  }

  if (!form.allow_status) {
    nextErrors.allow_status = "검수상태를 선택해 주세요.";
  }

  return nextErrors;
}

export function validateUpdateDoctorForm({
  form,
}: {
  form: DoctorFormValues;
}): DoctorFormErrors {
  const nextErrors = validateDoctorBaseForm(form);

  if (!form.status) {
    nextErrors.status = "운영상태를 선택해 주세요.";
  }

  if (!form.allow_status) {
    nextErrors.allow_status = "승인상태를 선택해 주세요.";
  }

  return nextErrors;
}
