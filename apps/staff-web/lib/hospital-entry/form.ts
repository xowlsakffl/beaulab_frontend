import type { HospitalEntryDetailResponse, HospitalEntryMediaAsset } from "@/lib/hospital-entry/detail";

export const HOSPITAL_ENTRY_EDIT_FORM_ID = "hospital-entry-edit-form";

export type HospitalEntryFormValues = {
  hospital_name: string;
  hospital_phone: string;
  address: string;
  address_detail: string;
  business_number: string;
  ceo_name: string;
  license_number: string;
  applicant_name: string;
  applicant_position: string;
  applicant_phone: string;
  applicant_email: string;
};

export type HospitalEntryFieldName = keyof HospitalEntryFormValues | "business_registration_file" | "license_file";
export type HospitalEntryFormErrors = Partial<Record<HospitalEntryFieldName, string>>;

export const INITIAL_HOSPITAL_ENTRY_FORM: HospitalEntryFormValues = {
  hospital_name: "",
  hospital_phone: "",
  address: "",
  address_detail: "",
  business_number: "",
  ceo_name: "",
  license_number: "",
  applicant_name: "",
  applicant_position: "",
  applicant_phone: "",
  applicant_email: "",
};

export const HOSPITAL_ENTRY_FIELD_NAMES = [
  "hospital_name",
  "hospital_phone",
  "address",
  "address_detail",
  "business_number",
  "business_registration_file",
  "ceo_name",
  "license_number",
  "license_file",
  "applicant_name",
  "applicant_position",
  "applicant_phone",
  "applicant_email",
] as const satisfies readonly HospitalEntryFieldName[];

const REQUIRED_FIELDS = [
  ["hospital_name", "병의원명"],
  ["hospital_phone", "전화번호"],
  ["address", "주소"],
  ["business_number", "사업자등록번호"],
  ["ceo_name", "대표자"],
  ["applicant_name", "신청자 이름"],
] as const satisfies readonly [keyof HospitalEntryFormValues, string][];

export function mapHospitalEntryDetailToForm(detail: HospitalEntryDetailResponse): HospitalEntryFormValues {
  return {
    hospital_name: detail.hospital_name?.trim() ?? "",
    hospital_phone: detail.hospital_phone?.trim() ?? "",
    address: detail.address?.trim() ?? "",
    address_detail: detail.address_detail?.trim() ?? "",
    business_number: detail.business_number?.trim() ?? "",
    ceo_name: detail.ceo_name?.trim() ?? "",
    license_number: detail.license_number?.trim() ?? "",
    applicant_name: detail.applicant_name?.trim() ?? "",
    applicant_position: detail.applicant_position?.trim() ?? "",
    applicant_phone: detail.applicant_phone?.trim() ?? "",
    applicant_email: detail.applicant_email?.trim() ?? "",
  };
}

export function validateHospitalEntryEditForm({
  form,
  businessRegistrationFile,
  existingBusinessRegistrationFile,
}: {
  form: HospitalEntryFormValues;
  businessRegistrationFile: File | null;
  existingBusinessRegistrationFile: HospitalEntryMediaAsset | null;
}) {
  const errors: HospitalEntryFormErrors = {};

  for (const [field, label] of REQUIRED_FIELDS) {
    if (!form[field].trim()) {
      errors[field] = `${label}을 입력해주세요.`;
    }
  }

  if (!existingBusinessRegistrationFile && !businessRegistrationFile) {
    errors.business_registration_file = "사업자등록증은 필수 항목입니다.";
  }

  if (form.applicant_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.applicant_email.trim())) {
    errors.applicant_email = "이메일주소 형식이 올바르지 않습니다.";
  }

  return errors;
}

export function buildHospitalEntryFormData({
  form,
  businessRegistrationFile,
  licenseFile,
  existingBusinessRegistrationFile,
  existingLicenseFile,
}: {
  form: HospitalEntryFormValues;
  businessRegistrationFile: File | null;
  licenseFile: File | null;
  existingBusinessRegistrationFile: HospitalEntryMediaAsset | null;
  existingLicenseFile: HospitalEntryMediaAsset | null;
}) {
  const formData = new FormData();

  for (const [field, value] of Object.entries(form)) {
    formData.append(field, value);
  }

  if (businessRegistrationFile) {
    formData.append("business_registration_file", businessRegistrationFile);
  } else {
    formData.append(
      "existing_business_registration_file_id",
      hospitalEntryMediaId(existingBusinessRegistrationFile) ?? "",
    );
  }

  if (licenseFile) {
    formData.append("license_file", licenseFile);
  } else {
    formData.append("existing_license_file_id", hospitalEntryMediaId(existingLicenseFile) ?? "");
  }

  return formData;
}

export function extractHospitalEntryFieldErrors(details: unknown): HospitalEntryFormErrors {
  if (!details || typeof details !== "object" || !("errors" in details)) {
    return {};
  }

  const rawErrors = (details as { errors?: unknown }).errors;
  if (!rawErrors || typeof rawErrors !== "object") {
    return {};
  }

  const nextErrors: HospitalEntryFormErrors = {};

  for (const [key, value] of Object.entries(rawErrors as Record<string, unknown>)) {
    const field = normalizeHospitalEntryErrorField(key);
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

function hospitalEntryMediaId(media?: HospitalEntryMediaAsset | null) {
  return media?.id !== null && media?.id !== undefined ? String(media.id) : null;
}

function normalizeHospitalEntryErrorField(key: string): HospitalEntryFieldName | null {
  const field = HOSPITAL_ENTRY_FIELD_NAMES.find((name) => key === name || key.startsWith(`${name}.`));
  return field ?? null;
}
