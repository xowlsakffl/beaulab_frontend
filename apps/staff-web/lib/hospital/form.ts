import type { ExistingMediaItem, CategorySelectorItem, CategorySelectorSection, MediaCollectionConfig } from "@beaulab/ui-admin";

export type HospitalFormValues = {
  name: string;
  company_name: string;
  tel: string;
  email: string;
  allow_status: string;
  status: string;
  address: string;
  address_detail: string;
  latitude: string;
  longitude: string;
  description: string;
  consulting_hours: string;
  direction: string;
  business_number: string;
  ceo_name: string;
  business_type: string;
  business_item: string;
  business_address: string;
  business_address_detail: string;
  issued_at: string;
  category_ids: number[];
};

export type HospitalFieldName = keyof HospitalFormValues | "logo" | "gallery" | "business_registration_file";
export type HospitalMediaField = "logo" | "gallery";
export type HospitalUniqueCheckField = "name" | "business_number";
export type HospitalAddressField = "address" | "business_address";
export type HospitalAddressDetailField = "address_detail" | "business_address_detail";
export type HospitalFormErrors = Partial<Record<HospitalFieldName, string>>;

export type HospitalUniqueCheckState = {
  value: string;
  available: boolean;
};

export type DuplicateCheckResponse = {
  exists: boolean;
  available: boolean;
  business_number?: string;
};

export type CategoryApiItem = {
  id: number;
  name: string;
  full_path?: string | null;
  parent_id?: number | null;
  depth: number;
  domain: string;
  status: string;
  has_children?: boolean;
};

export type MediaAsset = {
  id?: number | string;
  path?: string | null;
  url?: string | null;
  mime_type?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  sort_order?: number | null;
  is_primary?: boolean;
};

export type BusinessRegistrationAsset = {
  business_number?: string | null;
  company_name?: string | null;
  ceo_name?: string | null;
  business_type?: string | null;
  business_item?: string | null;
  business_address?: string | null;
  business_address_detail?: string | null;
  issued_at?: string | null;
  certificate_media?: MediaAsset | null;
};

export type HospitalCategoryItem = {
  id: number;
  name: string;
  is_primary?: boolean;
};

export type HospitalDetailResponse = {
  id: number;
  name: string;
  description?: string | null;
  address?: string | null;
  address_detail?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  tel?: string | null;
  email?: string | null;
  consulting_hours?: string | null;
  direction?: string | null;
  allow_status?: string | null;
  status?: string | null;
  logo?: MediaAsset | null;
  gallery?: MediaAsset[] | null;
  categories?: HospitalCategoryItem[] | null;
  business_registration?: BusinessRegistrationAsset | null;
};

export const FIELD_NAMES: readonly HospitalFieldName[] = [
  "name",
  "tel",
  "email",
  "allow_status",
  "status",
  "address",
  "address_detail",
  "latitude",
  "longitude",
  "description",
  "consulting_hours",
  "direction",
  "business_number",
  "ceo_name",
  "business_type",
  "business_item",
  "business_address",
  "business_address_detail",
  "issued_at",
  "category_ids",
  "company_name",
  "logo",
  "gallery",
  "business_registration_file",
] as const;

export const INITIAL_HOSPITAL_FORM: HospitalFormValues = {
  name: "",
  company_name: "",
  tel: "",
  email: "",
  allow_status: "PENDING",
  status: "SUSPENDED",
  address: "",
  address_detail: "",
  latitude: "",
  longitude: "",
  description: "",
  consulting_hours: "",
  direction: "",
  business_number: "",
  ceo_name: "",
  business_type: "",
  business_item: "",
  business_address: "",
  business_address_detail: "",
  issued_at: "",
  category_ids: [],
};

export const CATEGORY_SECTIONS: CategorySelectorSection[] = [
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

export const MEDIA_COLLECTIONS: readonly MediaCollectionConfig<HospitalMediaField>[] = [
  {
    key: "logo",
    label: "로고",
    accept: "image/jpeg,image/png,image/webp",
    multiple: false,
    maxFiles: 1,
    emptyText: "업로드한 로고 파일이 없습니다.",
    helperText: "jpg, png, webp / 최대 5MB",
    previewBehavior: "natural-center",
  },
  {
    key: "gallery",
    label: "대표/내부 이미지",
    accept: "image/jpeg,image/png,image/webp",
    multiple: true,
    maxFiles: 5,
    emptyText: "업로드한 이미지가 없습니다.",
    helperText: "첫 번째 이미지가 대표 이미지로 사용됩니다. 드래그로 순서를 바꿀 수 있습니다.",
    maxFilesText: "최대 5장까지 업로드할 수 있습니다.",
  },
];

export const HOSPITAL_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "정상" },
  { value: "SUSPENDED", label: "정지" },
  { value: "WITHDRAWN", label: "탈퇴" },
] as const;

export const HOSPITAL_ALLOW_STATUS_OPTIONS = [
  { value: "PENDING", label: "검수신청" },
  { value: "APPROVED", label: "검수완료" },
  { value: "REJECTED", label: "검수반려" },
] as const;

export const FIELD_FOCUS_ORDER: readonly HospitalFieldName[] = [
  "name",
  "status",
  "allow_status",
  "tel",
  "email",
  "category_ids",
  "address",
  "address_detail",
  "description",
  "consulting_hours",
  "direction",
  "business_number",
  "company_name",
  "ceo_name",
  "issued_at",
  "business_type",
  "business_item",
  "business_registration_file",
  "business_address",
  "business_address_detail",
  "logo",
  "gallery",
] as const;

export const DUPLICATE_ERROR_MESSAGES: Record<HospitalUniqueCheckField, string> = {
  name: "이미 등록된 병의원명입니다.",
  business_number: "이미 등록된 사업자 등록번호입니다.",
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export function isFieldName(value: string): value is HospitalFieldName {
  return (FIELD_NAMES as readonly string[]).includes(value);
}

export function normalizeErrorField(key: string): HospitalFieldName | null {
  if (key.startsWith("gallery")) return "gallery";
  if (key.startsWith("category_ids")) return "category_ids";
  if (isFieldName(key)) return key;
  return null;
}

export function extractFieldErrors(details: unknown): HospitalFormErrors {
  if (!details || typeof details !== "object" || !("errors" in details)) {
    return {};
  }

  const rawErrors = (details as { errors?: unknown }).errors;
  if (!rawErrors || typeof rawErrors !== "object") {
    return {};
  }

  const nextErrors: HospitalFormErrors = {};

  for (const [key, value] of Object.entries(rawErrors as Record<string, unknown>)) {
    const normalizedKey = normalizeErrorField(key);
    if (!normalizedKey) continue;

    if (Array.isArray(value)) {
      const firstMessage = value.find((item): item is string => typeof item === "string");
      if (firstMessage) nextErrors[normalizedKey] = firstMessage;
      continue;
    }

    if (typeof value === "string") {
      nextErrors[normalizedKey] = value;
    }
  }

  return nextErrors;
}

export function normalizeCategoryItem(item: CategoryApiItem): CategorySelectorItem {
  return {
    id: item.id,
    name: item.name,
    full_path: item.full_path,
    depth: item.depth,
    parent_id: item.parent_id,
    has_children: item.has_children,
  };
}

export function normalizeBusinessNumber(value: string): string {
  return value.replace(/\D+/g, "");
}

export function resolveMediaUrl(media?: MediaAsset | null): string | null {
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

export function mapHospitalDetailToForm(data: HospitalDetailResponse): HospitalFormValues {
  const businessRegistration = data.business_registration;

  return {
    ...INITIAL_HOSPITAL_FORM,
    name: data.name ?? "",
    company_name: businessRegistration?.company_name ?? "",
    tel: data.tel ?? "",
    email: data.email ?? "",
    allow_status: data.allow_status ?? INITIAL_HOSPITAL_FORM.allow_status,
    status: data.status ?? INITIAL_HOSPITAL_FORM.status,
    address: data.address ?? "",
    address_detail: data.address_detail ?? "",
    latitude: data.latitude !== null && data.latitude !== undefined ? String(data.latitude) : "",
    longitude: data.longitude !== null && data.longitude !== undefined ? String(data.longitude) : "",
    description: data.description ?? "",
    consulting_hours: data.consulting_hours ?? "",
    direction: data.direction ?? "",
    business_number: businessRegistration?.business_number ?? "",
    ceo_name: businessRegistration?.ceo_name ?? "",
    business_type: businessRegistration?.business_type ?? "",
    business_item: businessRegistration?.business_item ?? "",
    business_address: businessRegistration?.business_address ?? "",
    business_address_detail: businessRegistration?.business_address_detail ?? "",
    issued_at: businessRegistration?.issued_at ?? "",
    category_ids: data.categories?.map((category) => category.id) ?? [],
  };
}

export function formatBytes(bytes?: number | null) {
  if (!bytes || !Number.isFinite(bytes)) return "";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

export function getMediaFilename(media?: MediaAsset | null) {
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

  return `media-${media.id ?? "file"}`;
}

export function isImageMedia(media?: MediaAsset | null) {
  if (!media) return false;
  if (media.mime_type?.startsWith("image/")) return true;

  const candidate = `${media.path ?? ""} ${media.url ?? ""}`;
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(candidate);
}

export function buildHospitalExistingMediaItems(existingLogo: MediaAsset | null, existingGallery: MediaAsset[]) {
  return {
    logo: existingLogo
      ? [
          {
            id: existingLogo.id ?? "logo",
            url: resolveMediaUrl(existingLogo) ?? "",
            name: getMediaFilename(existingLogo),
            size: existingLogo.size ?? null,
            isImage: isImageMedia(existingLogo),
          },
        ].filter((item) => Boolean(item.url))
      : [],
    gallery: existingGallery
      .map((media, index) => ({
        id: media.id ?? `gallery-${index}`,
        url: resolveMediaUrl(media) ?? "",
        name: getMediaFilename(media),
        size: media.size ?? null,
        isImage: isImageMedia(media),
        isRepresentative: Boolean(media.is_primary) || index === 0,
      }))
      .filter((item) => Boolean(item.url)),
  };
}

function validateCommonHospitalForm(form: HospitalFormValues): HospitalFormErrors {
  const nextErrors: HospitalFormErrors = {};

  if (form.tel && !/^[0-9+\-().\s]{6,50}$/.test(form.tel)) {
    nextErrors.tel = "대표 번호 형식이 올바르지 않습니다.";
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    nextErrors.email = "올바른 이메일 형식이 아닙니다.";
  }

  if (!form.status) {
    nextErrors.status = "상태는 필수 항목입니다.";
  }

  if (!form.allow_status) {
    nextErrors.allow_status = "검수상태는 필수 항목입니다.";
  }

  if (form.address.trim() && (!form.latitude.trim() || !form.longitude.trim())) {
    nextErrors.address = "병의원 주소 좌표를 확인하지 못했습니다. 주소를 다시 선택해주세요.";
  }

  if (!form.business_number.trim()) {
    nextErrors.business_number = "사업자 등록번호는 필수 항목입니다.";
  }

  if (!form.company_name.trim()) {
    nextErrors.company_name = "상호명은 필수 항목입니다.";
  }

  if (!form.ceo_name.trim()) {
    nextErrors.ceo_name = "대표자는 필수 항목입니다.";
  }

  if (!form.business_type.trim()) {
    nextErrors.business_type = "업태는 필수 항목입니다.";
  }

  if (!form.business_item.trim()) {
    nextErrors.business_item = "종목은 필수 항목입니다.";
  }

  if (form.issued_at && Number.isNaN(new Date(form.issued_at).getTime())) {
    nextErrors.issued_at = "사업자 등록일 형식이 올바르지 않습니다.";
  }

  return nextErrors;
}

export function validateCreateHospitalForm({
  form,
  logo,
  gallery,
  businessRegistrationFile,
  uniqueChecks,
}: {
  form: HospitalFormValues;
  logo: File | null;
  gallery: File[];
  businessRegistrationFile: File | null;
  uniqueChecks: Record<HospitalUniqueCheckField, HospitalUniqueCheckState | null>;
}): HospitalFormErrors {
  const nextErrors = validateCommonHospitalForm(form);
  const normalizedName = form.name.trim();
  const normalizedBusinessNumber = normalizeBusinessNumber(form.business_number);

  if (!normalizedName) {
    nextErrors.name = "병의원명은 필수 항목입니다.";
  } else if (uniqueChecks.name?.value === normalizedName && !uniqueChecks.name.available) {
    nextErrors.name = DUPLICATE_ERROR_MESSAGES.name;
  }

  if (
    normalizedBusinessNumber &&
    uniqueChecks.business_number?.value === normalizedBusinessNumber &&
    !uniqueChecks.business_number.available
  ) {
    nextErrors.business_number = DUPLICATE_ERROR_MESSAGES.business_number;
  }

  if (!logo) {
    nextErrors.logo = "로고는 필수 항목입니다.";
  }

  if (gallery.length === 0) {
    nextErrors.gallery = "대표/내부 이미지는 최소 1장 필요합니다.";
  }

  if (!businessRegistrationFile) {
    nextErrors.business_registration_file = "사업자등록증 파일은 필수 항목입니다.";
  }

  return nextErrors;
}

export function validateUpdateHospitalForm({
  form,
  logo,
  existingLogo,
  gallery,
  existingGallery,
  businessRegistrationFile,
  existingCertificate,
}: {
  form: HospitalFormValues;
  logo: File | null;
  existingLogo: MediaAsset | null;
  gallery: File[];
  existingGallery: MediaAsset[];
  businessRegistrationFile: File | null;
  existingCertificate: MediaAsset | null;
}): HospitalFormErrors {
  const nextErrors = validateCommonHospitalForm(form);

  if (!logo && !existingLogo) {
    nextErrors.logo = "로고는 필수 항목입니다.";
  }

  if (gallery.length === 0 && existingGallery.length === 0) {
    nextErrors.gallery = "대표/내부 이미지는 최소 1장 필요합니다.";
  }

  if (!businessRegistrationFile && !existingCertificate) {
    nextErrors.business_registration_file = "사업자등록증 파일은 필수 항목입니다.";
  }

  return nextErrors;
}
