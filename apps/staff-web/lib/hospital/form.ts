import type { CategorySelectorSection, MediaCollectionConfig } from "@beaulab/ui-admin";

import {
  formatBusinessNumberInput,
  isCompleteBusinessNumber,
  normalizeBusinessNumber,
} from "@/lib/common/business-number";
import { CATEGORY_DOMAINS, CATEGORY_USAGES } from "@/lib/common/category";
import { validateImageFileRuleMessage, validateImageFilesRuleMessage } from "@/lib/common/media-validation";
import { REVIEW_ALLOW_STATUS_WITH_NOT_APPLIED_OPTIONS } from "@/lib/common/review-status";
import {
  getMediaFilename,
  isImageMedia,
  resolveMediaUrl,
  type HospitalDetailResponse,
  type MediaAsset,
} from "./detail";

export type HospitalFormValues = {
  name: string;
  department: string;
  company_name: string;
  tel: string;
  ad_reception_phone_1: string;
  ad_reception_phone_2: string;
  ad_reception_phone_3: string;
  allow_status: string;
  status: string;
  address: string;
  address_detail: string;
  latitude: string;
  longitude: string;
  description: string;
  youtube_link: string;
  consulting_hours: string;
  operation_hours: HospitalOperationHoursFormValues;
  direction: string;
  business_number: string;
  ceo_name: string;
  business_type: string;
  business_item: string;
  business_address: string;
  business_address_detail: string;
  settlement_bank_name: string;
  settlement_account_number: string;
  settlement_account_holder: string;
  tax_invoice_email: string;
  issued_at: string;
  category_ids: number[];
  feature_ids: number[];
};

export type HospitalOperationDayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type HospitalOperationHoursFormValues = Record<
  HospitalOperationDayKey,
  {
    start: string;
    end: string;
    is_closed: boolean;
  }
>;

export type HospitalFieldName = keyof HospitalFormValues | "logo" | "gallery" | "business_registration_file";
export type HospitalMediaField = "logo" | "gallery";
export type HospitalUniqueCheckField = "name" | "business_number";
export type HospitalAddressField = "address";
export type HospitalAddressDetailField = "address_detail";
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

export const FIELD_NAMES: readonly HospitalFieldName[] = [
  "name",
  "department",
  "tel",
  "ad_reception_phone_1",
  "ad_reception_phone_2",
  "ad_reception_phone_3",
  "allow_status",
  "status",
  "address",
  "address_detail",
  "latitude",
  "longitude",
  "description",
  "consulting_hours",
  "operation_hours",
  "direction",
  "business_number",
  "ceo_name",
  "business_type",
  "youtube_link",
  "business_item",
  "business_address",
  "business_address_detail",
  "settlement_bank_name",
  "settlement_account_number",
  "settlement_account_holder",
  "tax_invoice_email",
  "issued_at",
  "category_ids",
  "feature_ids",
  "company_name",
  "logo",
  "gallery",
  "business_registration_file",
] as const;

export const INITIAL_OPERATION_HOURS: HospitalOperationHoursFormValues = {
  mon: { start: "10:00", end: "19:00", is_closed: false },
  tue: { start: "10:00", end: "19:00", is_closed: false },
  wed: { start: "10:00", end: "19:00", is_closed: false },
  thu: { start: "10:00", end: "19:00", is_closed: false },
  fri: { start: "10:00", end: "19:00", is_closed: false },
  sat: { start: "10:00", end: "19:00", is_closed: false },
  sun: { start: "10:00", end: "19:00", is_closed: false },
};

export const INITIAL_HOSPITAL_FORM: HospitalFormValues = {
  name: "",
  department: "OTHER",
  company_name: "",
  tel: "",
  ad_reception_phone_1: "",
  ad_reception_phone_2: "",
  ad_reception_phone_3: "",
  allow_status: "PENDING",
  status: "ACTIVE",
  address: "",
  address_detail: "",
  latitude: "",
  longitude: "",
  description: "",
  youtube_link: "",
  consulting_hours: "",
  operation_hours: INITIAL_OPERATION_HOURS,
  direction: "",
  business_number: "",
  ceo_name: "",
  business_type: "",
  business_item: "",
  business_address: "",
  business_address_detail: "",
  settlement_bank_name: "",
  settlement_account_number: "",
  settlement_account_holder: "",
  tax_invoice_email: "",
  issued_at: "",
  category_ids: [],
  feature_ids: [],
};

export const HOSPITAL_CATEGORY_MAX_SELECTION = 5;
const HOSPITAL_LOGO_MAX_BYTES = 5 * 1024 * 1024;
const HOSPITAL_LOGO_ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const HOSPITAL_LOGO_ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const HOSPITAL_LOGO_VALIDATION_MESSAGE =
  "로고 이미지는 아래 조건에 맞는 파일만 업로드할 수 있습니다.\n\n- 파일 형식: JPG, PNG, WEBP\n- 파일 용량: 5MB 이하";
const HOSPITAL_GALLERY_ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
const HOSPITAL_GALLERY_ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];
const HOSPITAL_GALLERY_MAX_BYTES = 10 * 1024 * 1024;
const HOSPITAL_GALLERY_VALIDATION_MESSAGE =
  "병의원 이미지는 아래 조건에 맞는 파일만 업로드할 수 있습니다.\n\n- 파일 형식: JPG, PNG\n- 파일 용량: 10MB 이하";
const HOSPITAL_LOGO_IMAGE_RULE = {
  allowedExtensions: HOSPITAL_LOGO_ALLOWED_IMAGE_EXTENSIONS,
  allowedMimeTypes: HOSPITAL_LOGO_ALLOWED_IMAGE_TYPES,
  maxBytes: HOSPITAL_LOGO_MAX_BYTES,
};
const HOSPITAL_GALLERY_IMAGE_RULE = {
  allowedExtensions: HOSPITAL_GALLERY_ALLOWED_IMAGE_EXTENSIONS,
  allowedMimeTypes: HOSPITAL_GALLERY_ALLOWED_IMAGE_TYPES,
  maxBytes: HOSPITAL_GALLERY_MAX_BYTES,
};

export const CATEGORY_SECTIONS: CategorySelectorSection[] = [
  {
    key: "medical-subject",
    label: "진료과목",
    domain: CATEGORY_DOMAINS.HOSPITAL_MEDICAL,
    usage: CATEGORY_USAGES.HOSPITAL_DOCTOR_SUBJECT,
    searchPlaceholder: "진료과목명을 입력해주세요. (ex. 눈, 피부)",
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
    accept: "image/jpeg,image/png,.jpg,.jpeg,.png",
    multiple: true,
    maxFiles: 5,
    emptyText: "업로드한 이미지가 없습니다.",
    helperText: "jpg, jpeg, png / 최대 10MB",
    maxFilesText: "(최대 5장)",
  },
];

export const HOSPITAL_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "정상" },
  { value: "SUSPENDED", label: "운영중지" },
  { value: "WITHDRAWN", label: "탈퇴" },
] as const;

export const HOSPITAL_ALLOW_STATUS_OPTIONS = REVIEW_ALLOW_STATUS_WITH_NOT_APPLIED_OPTIONS;

export const FIELD_FOCUS_ORDER: readonly HospitalFieldName[] = [
  "name",
  "department",
  "status",
  "allow_status",
  "tel",
  "ad_reception_phone_1",
  "category_ids",
  "feature_ids",
  "address",
  "address_detail",
  "description",
  "consulting_hours",
  "operation_hours",
  "direction",
  "business_number",
  "company_name",
  "ceo_name",
  "issued_at",
  "business_type",
  "youtube_link",
  "business_item",
  "business_registration_file",
  "business_address",
  "business_address_detail",
  "tax_invoice_email",
  "settlement_bank_name",
  "settlement_account_number",
  "settlement_account_holder",
  "logo",
  "gallery",
] as const;

export const DUPLICATE_ERROR_MESSAGES: Record<HospitalUniqueCheckField, string> = {
  name: "이미 등록된 병의원명입니다.",
  business_number: "이미 등록된 사업자 등록번호입니다.",
};

export function isFieldName(value: string): value is HospitalFieldName {
  return (FIELD_NAMES as readonly string[]).includes(value);
}

export function normalizeErrorField(key: string): HospitalFieldName | null {
  if (key.startsWith("gallery")) return "gallery";
  if (key.startsWith("category_ids")) return "category_ids";
  if (key.startsWith("feature_ids")) return "feature_ids";
  if (key.startsWith("operation_hours")) return "operation_hours";
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

export { normalizeBusinessNumber } from "@/lib/common/business-number";

export function isValidYoutubeLink(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      (hostname === "youtube.com" || hostname === "youtu.be" || hostname.endsWith(".youtube.com"))
    );
  } catch {
    return false;
  }
}

export function mapHospitalDetailToForm(data: HospitalDetailResponse): HospitalFormValues {
  const businessRegistration = data.business_registration;
  const settlementAccount = businessRegistration?.settlement_account;

  return {
    ...INITIAL_HOSPITAL_FORM,
    name: data.name ?? "",
    department: data.department ?? INITIAL_HOSPITAL_FORM.department,
    company_name: businessRegistration?.company_name ?? "",
    tel: data.tel ?? "",
    ad_reception_phone_1: data.ad_reception_phones?.phone_1 ?? "",
    ad_reception_phone_2: data.ad_reception_phones?.phone_2 ?? "",
    ad_reception_phone_3: data.ad_reception_phones?.phone_3 ?? "",
    allow_status: data.allow_status ?? INITIAL_HOSPITAL_FORM.allow_status,
    status: data.status ?? INITIAL_HOSPITAL_FORM.status,
    address: data.address ?? "",
    address_detail: data.address_detail ?? "",
    latitude: data.latitude !== null && data.latitude !== undefined ? String(data.latitude) : "",
    longitude: data.longitude !== null && data.longitude !== undefined ? String(data.longitude) : "",
    description: data.description ?? "",
    youtube_link: data.youtube_link ?? "",
    consulting_hours: data.consulting_hours ?? "",
    operation_hours: normalizeOperationHours(data.operation_hours),
    direction: data.direction ?? "",
    business_number: formatBusinessNumberInput(businessRegistration?.business_number ?? ""),
    ceo_name: businessRegistration?.ceo_name ?? "",
    business_type: businessRegistration?.business_type ?? "",
    business_item: businessRegistration?.business_item ?? "",
    business_address: businessRegistration?.business_address ?? "",
    business_address_detail: businessRegistration?.business_address_detail ?? "",
    settlement_bank_name: settlementAccount?.bank_name ?? "",
    settlement_account_number: settlementAccount?.account_number ?? "",
    settlement_account_holder: settlementAccount?.account_holder ?? "",
    tax_invoice_email: settlementAccount?.tax_invoice_email ?? "",
    issued_at: businessRegistration?.issued_at ?? "",
    category_ids:
      data.categories
        ?.filter((category) => category.depth === undefined || category.depth === null || category.depth === 1)
        .map((category) => category.id) ?? [],
    feature_ids: data.features?.map((feature) => feature.id) ?? [],
  };
}

export function normalizeOperationHours(
  value: HospitalDetailResponse["operation_hours"],
): HospitalOperationHoursFormValues {
  const nextHours: HospitalOperationHoursFormValues = { ...INITIAL_OPERATION_HOURS };

  for (const key of Object.keys(INITIAL_OPERATION_HOURS) as HospitalOperationDayKey[]) {
    const item = value?.[key];
    nextHours[key] = {
      start: item?.start ?? INITIAL_OPERATION_HOURS[key].start,
      end: item?.end ?? INITIAL_OPERATION_HOURS[key].end,
      is_closed: Boolean(item?.is_closed),
    };
  }

  return nextHours;
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

export async function validateHospitalLogoImageFile(file: File) {
  return validateImageFileRuleMessage(file, HOSPITAL_LOGO_IMAGE_RULE, HOSPITAL_LOGO_VALIDATION_MESSAGE);
}

export async function validateHospitalGalleryUploadFiles(files: File[]) {
  return validateImageFilesRuleMessage(files, HOSPITAL_GALLERY_IMAGE_RULE, HOSPITAL_GALLERY_VALIDATION_MESSAGE);
}

export type BuildCreateHospitalFormDataParams = {
  form: HospitalFormValues;
  logo: File | null;
  gallery: File[];
  businessRegistrationFile: File | null;
};

export function buildCreateHospitalFormData({
  form,
  logo,
  gallery,
  businessRegistrationFile,
}: BuildCreateHospitalFormDataParams): FormData {
  const formData = new FormData();

  formData.append("name", form.name.trim());
  formData.append("department", form.department);
  formData.append("company_name", form.company_name.trim() || form.name.trim());
  formData.append("description", form.description.trim());
  formData.append("youtube_link", form.youtube_link.trim());
  formData.append("consulting_hours", form.consulting_hours.trim());
  formData.append("direction", form.direction.trim());
  formData.append("address", form.address.trim());
  formData.append("address_detail", form.address_detail.trim());
  formData.append("latitude", form.latitude.trim());
  formData.append("longitude", form.longitude.trim());
  formData.append("tel", form.tel.trim());
  formData.append("ad_reception_phone_1", form.ad_reception_phone_1.trim());
  formData.append("ad_reception_phone_2", form.ad_reception_phone_2.trim());
  formData.append("ad_reception_phone_3", form.ad_reception_phone_3.trim());
  formData.append("business_number", normalizeBusinessNumber(form.business_number));
  formData.append("ceo_name", form.ceo_name.trim());
  formData.append("business_type", form.business_type.trim());
  formData.append("business_item", form.business_item.trim());
  formData.append("business_address", form.business_address.trim());
  formData.append("business_address_detail", form.business_address_detail.trim());
  formData.append("settlement_bank_name", form.settlement_bank_name.trim());
  formData.append("settlement_account_number", form.settlement_account_number.trim());
  formData.append("settlement_account_holder", form.settlement_account_holder.trim());
  formData.append("tax_invoice_email", form.tax_invoice_email.trim());
  appendOperationHours(formData, form.operation_hours);

  if (form.issued_at) {
    formData.append("issued_at", form.issued_at);
  }

  form.category_ids.forEach((categoryId) => {
    formData.append("category_ids[]", String(categoryId));
  });
  form.feature_ids.forEach((featureId) => {
    formData.append("feature_ids[]", String(featureId));
  });

  if (logo) {
    formData.append("logo", logo);
  }

  if (businessRegistrationFile) {
    formData.append("business_registration_file", businessRegistrationFile);
  }

  gallery.forEach((file) => formData.append("gallery[]", file));

  return formData;
}

export type BuildUpdateHospitalFormDataParams = {
  form: HospitalFormValues;
  baseline: HospitalFormValues | null;
  logo: File | null;
  existingLogo: MediaAsset | null;
  initialLogoId: string | null;
  gallery: File[];
  galleryOrder: string[];
  initialGalleryOrder: string[];
  businessRegistrationFile: File | null;
  existingCertificate: MediaAsset | null;
  initialCertificateId: string | null;
};

export function buildUpdateHospitalFormData({
  form,
  baseline,
  logo,
  existingLogo,
  initialLogoId,
  gallery,
  galleryOrder,
  initialGalleryOrder,
  businessRegistrationFile,
  existingCertificate,
  initialCertificateId,
}: BuildUpdateHospitalFormDataParams): FormData {
  const formData = new FormData();
  const baseForm = baseline ?? INITIAL_HOSPITAL_FORM;

  formData.append("_method", "PATCH");
  appendChangedField(formData, "department", form.department, baseForm.department);
  appendChangedField(formData, "description", form.description.trim(), baseForm.description.trim());
  appendChangedField(formData, "youtube_link", form.youtube_link.trim(), baseForm.youtube_link.trim());
  appendChangedField(formData, "consulting_hours", form.consulting_hours.trim(), baseForm.consulting_hours.trim());
  appendChangedField(formData, "direction", form.direction.trim(), baseForm.direction.trim());
  appendChangedField(formData, "address", form.address.trim(), baseForm.address.trim());
  appendChangedField(formData, "address_detail", form.address_detail.trim(), baseForm.address_detail.trim());
  appendChangedField(formData, "latitude", form.latitude.trim(), baseForm.latitude.trim());
  appendChangedField(formData, "longitude", form.longitude.trim(), baseForm.longitude.trim());
  appendChangedField(formData, "tel", form.tel.trim(), baseForm.tel.trim());
  appendChangedField(
    formData,
    "ad_reception_phone_1",
    form.ad_reception_phone_1.trim(),
    baseForm.ad_reception_phone_1.trim(),
  );
  appendChangedField(
    formData,
    "ad_reception_phone_2",
    form.ad_reception_phone_2.trim(),
    baseForm.ad_reception_phone_2.trim(),
  );
  appendChangedField(
    formData,
    "ad_reception_phone_3",
    form.ad_reception_phone_3.trim(),
    baseForm.ad_reception_phone_3.trim(),
  );
  appendChangedField(
    formData,
    "business_number",
    normalizeBusinessNumber(form.business_number),
    normalizeBusinessNumber(baseForm.business_number),
  );
  appendChangedField(
    formData,
    "company_name",
    form.company_name.trim() || form.name.trim(),
    baseForm.company_name.trim() || baseForm.name.trim(),
  );
  appendChangedField(formData, "ceo_name", form.ceo_name.trim(), baseForm.ceo_name.trim());
  appendChangedField(formData, "business_type", form.business_type.trim(), baseForm.business_type.trim());
  appendChangedField(formData, "business_item", form.business_item.trim(), baseForm.business_item.trim());
  appendChangedField(formData, "business_address", form.business_address.trim(), baseForm.business_address.trim());
  appendChangedField(
    formData,
    "business_address_detail",
    form.business_address_detail.trim(),
    baseForm.business_address_detail.trim(),
  );
  appendChangedField(
    formData,
    "settlement_bank_name",
    form.settlement_bank_name.trim(),
    baseForm.settlement_bank_name.trim(),
  );
  appendChangedField(
    formData,
    "settlement_account_number",
    form.settlement_account_number.trim(),
    baseForm.settlement_account_number.trim(),
  );
  appendChangedField(
    formData,
    "settlement_account_holder",
    form.settlement_account_holder.trim(),
    baseForm.settlement_account_holder.trim(),
  );
  appendChangedField(formData, "tax_invoice_email", form.tax_invoice_email.trim(), baseForm.tax_invoice_email.trim());
  appendChangedField(formData, "issued_at", form.issued_at, baseForm.issued_at);

  if (operationHoursChanged(form.operation_hours, baseForm.operation_hours)) {
    appendOperationHours(formData, form.operation_hours);
  }

  if (!sameNumberSet(form.category_ids, baseForm.category_ids)) {
    appendIdList(formData, "category_ids", form.category_ids);
  }

  if (!sameNumberSet(form.feature_ids, baseForm.feature_ids)) {
    appendIdList(formData, "feature_ids", form.feature_ids);
  }

  if (logo) {
    formData.append("logo", logo);
  } else if (hospitalMediaId(existingLogo) !== initialLogoId) {
    formData.append("existing_logo_id", hospitalMediaId(existingLogo) ?? "");
  }

  appendChangedGallery(formData, gallery, galleryOrder, initialGalleryOrder);

  if (businessRegistrationFile) {
    formData.append("business_registration_file", businessRegistrationFile);
  } else if (hospitalMediaId(existingCertificate) !== initialCertificateId) {
    formData.append("existing_business_registration_file_id", hospitalMediaId(existingCertificate) ?? "");
  }

  return formData;
}

export function hospitalMediaId(media?: MediaAsset | null) {
  return media?.id !== null && media?.id !== undefined ? String(media.id) : null;
}

function validateCommonHospitalForm(form: HospitalFormValues): HospitalFormErrors {
  const nextErrors: HospitalFormErrors = {};

  if (!form.department) {
    nextErrors.department = "분과는 필수 항목입니다.";
  }

  if (!form.tel.trim()) {
    nextErrors.tel = "대표 번호는 필수 항목입니다.";
  } else if (!/^[0-9+\-().\s]{6,50}$/.test(form.tel)) {
    nextErrors.tel = "대표 번호 형식이 올바르지 않습니다.";
  }

  if (!form.ad_reception_phone_1.trim()) {
    nextErrors.ad_reception_phone_1 = "필수 담당자 전화번호를 입력해주세요.";
  } else if (!/^(010-\d{4}-\d{4}|010\d{8})$/.test(form.ad_reception_phone_1)) {
    nextErrors.ad_reception_phone_1 = "필수 담당자 전화번호를 010-0000-0000 형식으로 입력해주세요.";
  }

  if (form.ad_reception_phone_2 && !/^(010-\d{4}-\d{4}|010\d{8})$/.test(form.ad_reception_phone_2)) {
    nextErrors.ad_reception_phone_2 = "담당자2 전화번호를 010-0000-0000 형식으로 입력해주세요.";
  }

  if (form.ad_reception_phone_3 && !/^(010-\d{4}-\d{4}|010\d{8})$/.test(form.ad_reception_phone_3)) {
    nextErrors.ad_reception_phone_3 = "담당자3 전화번호를 010-0000-0000 형식으로 입력해주세요.";
  }

  if (form.youtube_link.trim() && !isValidYoutubeLink(form.youtube_link.trim())) {
    nextErrors.youtube_link = "유튜브 링크 형식이 올바르지 않습니다.";
  }

  if (form.tax_invoice_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.tax_invoice_email)) {
    nextErrors.tax_invoice_email = "세금계산서 이메일 형식이 올바르지 않습니다.";
  }

  if (form.settlement_account_number && !/^[0-9\-\s]{2,50}$/.test(form.settlement_account_number)) {
    nextErrors.settlement_account_number = "정산 계좌번호 형식이 올바르지 않습니다.";
  }

  if (!form.status) {
    nextErrors.status = "상태는 필수 항목입니다.";
  }

  if (!form.address.trim()) {
    nextErrors.address = "병의원 주소는 필수 항목입니다.";
  } else if (!form.latitude.trim() || !form.longitude.trim()) {
    nextErrors.address = "병의원 주소 좌표를 확인하지 못했습니다. 주소를 다시 선택해주세요.";
  }

  if (!form.address_detail.trim()) {
    nextErrors.address_detail = "상세 주소는 필수 항목입니다.";
  }

  for (const item of Object.values(form.operation_hours)) {
    if (item.is_closed) continue;
    if (!item.start || !item.end) {
      nextErrors.operation_hours = "진료하는 요일은 시작/종료 시간을 입력해주세요.";
      break;
    }
  }

  if (!form.business_number.trim()) {
    nextErrors.business_number = "사업자 등록번호는 필수 항목입니다.";
  } else if (!isCompleteBusinessNumber(form.business_number)) {
    nextErrors.business_number = "사업자 등록번호는 숫자 10자리로 입력해 주세요.";
  }

  if (!form.company_name.trim() && !form.name.trim()) {
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

  if (form.feature_ids.length === 0) {
    nextErrors.feature_ids = "병의원정보는 최소 1개 이상 선택해야 합니다.";
  }

  if (form.category_ids.length > HOSPITAL_CATEGORY_MAX_SELECTION) {
    nextErrors.category_ids = `진료과목은 최대 ${HOSPITAL_CATEGORY_MAX_SELECTION}개까지 선택할 수 있습니다.`;
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

function appendChangedField(formData: FormData, key: string, value: string, baseline: string) {
  if (value !== baseline) {
    formData.append(key, value);
  }
}

function appendIdList(formData: FormData, key: string, ids: number[]) {
  if (ids.length === 0) {
    formData.append(`${key}[]`, "");
    return;
  }

  ids.forEach((id) => formData.append(`${key}[]`, String(id)));
}

function appendOperationHours(formData: FormData, operationHours: HospitalFormValues["operation_hours"]) {
  Object.entries(operationHours).forEach(([dayKey, item]) => {
    formData.append(`operation_hours[${dayKey}][is_closed]`, item.is_closed ? "1" : "0");
    formData.append(`operation_hours[${dayKey}][start]`, item.start);
    formData.append(`operation_hours[${dayKey}][end]`, item.end);
  });
}

function appendChangedGallery(
  formData: FormData,
  gallery: File[],
  galleryOrder: string[],
  initialGalleryOrder: string[],
) {
  const galleryChanged = gallery.length > 0 || !sameStringList(galleryOrder, initialGalleryOrder);

  if (galleryChanged && galleryOrder.length > 0) {
    let nextGalleryFileIndex = 0;

    galleryOrder.forEach((token) => {
      if (token.startsWith("existing:")) {
        formData.append("gallery_order[]", token);
        return;
      }

      if (token.startsWith("new:")) {
        formData.append("gallery_order[]", `new:${nextGalleryFileIndex}`);
        nextGalleryFileIndex += 1;
      }
    });
  } else if (galleryChanged) {
    formData.append("gallery_order[]", "");
  }

  if (galleryChanged && gallery.length > 0) {
    gallery.forEach((file) => formData.append("gallery[]", file));
  }
}

function sameNumberSet(left: number[], right: number[]) {
  const normalize = (items: number[]) =>
    [...new Set(items.map(Number).filter((item) => Number.isFinite(item)))].sort((a, b) => a - b).join(",");

  return normalize(left) === normalize(right);
}

function sameStringList(left: string[], right: string[]) {
  if (left.length !== right.length) return false;

  return left.every((item, index) => item === right[index]);
}

function operationHoursChanged(
  current: HospitalFormValues["operation_hours"],
  baseline: HospitalFormValues["operation_hours"],
) {
  return JSON.stringify(current) !== JSON.stringify(baseline);
}
