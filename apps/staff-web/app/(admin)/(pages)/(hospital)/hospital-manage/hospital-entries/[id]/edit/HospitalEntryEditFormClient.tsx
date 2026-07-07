"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { Button, Card, InputField, SpinnerBlock, StatusBadge, useGlobalAlert } from "@beaulab/ui-admin";

import { resolveAllowStatusValue } from "@/components/common/AllowStatusControls";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import {
  HospitalMediaPreviewModal,
  type HospitalMediaPreviewState,
} from "@/components/hospital/media/HospitalMediaPreviewModal";
import { useObjectUrl } from "@/hooks/common/useObjectUrl";
import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import {
  getHospitalEntryMediaFilename,
  isHospitalEntryImageMedia,
  resolveHospitalEntryMediaUrl,
  type HospitalEntryDetailResponse,
  type HospitalEntryMediaAsset,
} from "@/lib/hospital-entry/detail";
import { hospitalEntryAllowStatusColor, labelHospitalEntryAllowStatus } from "@/lib/hospital-entry/list";

const HOSPITAL_ENTRY_EDIT_FORM_ID = "hospital-entry-edit-form";

const infoCardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const cardTitleClassName = "text-sm font-semibold text-gray-800";
const labelClassName = "pt-0.5 text-xs font-semibold text-gray-500";
const fileSelectButtonClassName = "h-8 px-3 text-xs";

type HospitalEntryFormValues = {
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

type HospitalEntryFieldName = keyof HospitalEntryFormValues | "business_registration_file" | "license_file";
type HospitalEntryFormErrors = Partial<Record<HospitalEntryFieldName, string>>;

const INITIAL_FORM: HospitalEntryFormValues = {
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

const REQUIRED_FIELDS = [
  ["hospital_name", "병의원명"],
  ["hospital_phone", "전화번호"],
  ["address", "주소"],
  ["business_number", "사업자등록번호"],
  ["ceo_name", "대표자"],
  ["applicant_name", "신청자 이름"],
] as const satisfies readonly [keyof HospitalEntryFormValues, string][];

const FIELD_NAMES = [
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

export default function HospitalEntryEditFormClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();

  const rawEntryId = Array.isArray(params.id) ? params.id[0] : params.id;
  const entryId = Number(rawEntryId);

  const businessFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const licenseFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [form, setForm] = React.useState<HospitalEntryFormValues>(INITIAL_FORM);
  const [detail, setDetail] = React.useState<HospitalEntryDetailResponse | null>(null);
  const [existingBusinessRegistrationFile, setExistingBusinessRegistrationFile] =
    React.useState<HospitalEntryMediaAsset | null>(null);
  const [existingLicenseFile, setExistingLicenseFile] = React.useState<HospitalEntryMediaAsset | null>(null);
  const [businessRegistrationFile, setBusinessRegistrationFile] = React.useState<File | null>(null);
  const [licenseFile, setLicenseFile] = React.useState<File | null>(null);
  const [errors, setErrors] = React.useState<HospitalEntryFormErrors>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [previewMedia, setPreviewMedia] = React.useState<HospitalMediaPreviewState | null>(null);

  const detailPath = React.useMemo(() => {
    if (!Number.isFinite(entryId) || entryId <= 0) return "/hospital-manage/hospital-entries";

    const rawReturnTo = searchParams.get("returnTo");
    return rawReturnTo
      ? `/hospital-manage/hospital-entries/${entryId}?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/hospital-manage/hospital-entries/${entryId}`;
  }, [entryId, searchParams]);

  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: "/hospital-manage/hospital-entries",
        allowedPrefix: "/hospital-manage/hospital-entries",
        highlightId,
      }),
    [searchParams],
  );

  const clearError = React.useCallback((field: HospitalEntryFieldName) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;

      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setField = React.useCallback(
    <K extends keyof HospitalEntryFormValues>(field: K, value: HospitalEntryFormValues[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      clearError(field);
    },
    [clearError],
  );

  const fetchEntry = React.useCallback(async () => {
    if (!Number.isFinite(entryId) || entryId <= 0) {
      setLoadError("올바르지 않은 입점신청 경로입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await api.get<HospitalEntryDetailResponse>(`/hospital-entries/${entryId}`);

      if (!isApiSuccess(response)) {
        setLoadError(response.error.message || "입점신청 정보를 불러오지 못했습니다.");
        return;
      }

      setDetail(response.data);
      setForm(mapDetailToForm(response.data));
      setExistingBusinessRegistrationFile(response.data.business_registration_file ?? null);
      setExistingLicenseFile(response.data.license_file ?? null);
      setBusinessRegistrationFile(null);
      setLicenseFile(null);
      setErrors({});
    } catch {
      setLoadError("입점신청 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [entryId]);

  React.useEffect(() => {
    void fetchEntry();
  }, [fetchEntry]);

  const validate = React.useCallback(() => {
    const nextErrors: HospitalEntryFormErrors = {};

    for (const [field, label] of REQUIRED_FIELDS) {
      if (!form[field].trim()) {
        nextErrors[field] = `${label}을 입력해주세요.`;
      }
    }

    if (!existingBusinessRegistrationFile && !businessRegistrationFile) {
      nextErrors.business_registration_file = "사업자등록증은 필수 항목입니다.";
    }

    if (form.applicant_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.applicant_email.trim())) {
      nextErrors.applicant_email = "이메일주소 형식이 올바르지 않습니다.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      window.setTimeout(() => focusFirstError(nextErrors), 0);
      return false;
    }

    return true;
  }, [businessRegistrationFile, existingBusinessRegistrationFile, form]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    if (!Number.isFinite(entryId) || entryId <= 0) return;

    const formData = buildHospitalEntryFormData(
      form,
      businessRegistrationFile,
      licenseFile,
      existingBusinessRegistrationFile,
      existingLicenseFile,
    );

    setIsSubmitting(true);

    try {
      const response = await api.post<HospitalEntryDetailResponse>(`/hospital-entries/${entryId}`, formData);

      if (!isApiSuccess(response)) {
        const nextErrors = extractHospitalEntryFieldErrors(response.error.details);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          window.setTimeout(() => focusFirstError(nextErrors), 0);
        }

        showAlert({
          variant: "error",
          title: "입점신청 수정 실패",
          message: response.error.message || "입점신청 수정에 실패했습니다.",
        });
        return;
      }

      showAlert({
        variant: "success",
        title: "입점신청 수정 완료",
        message: "수정된 입점신청 정보를 확인할 수 있습니다.",
      });
      router.push(detailPath);
    } catch {
      showAlert({
        variant: "error",
        title: "입점신청 수정 실패",
        message: "입점신청 수정 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerActions = React.useMemo(
    () => (
      <>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push(getReturnToPath())}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button type="submit" form={HOSPITAL_ENTRY_EDIT_FORM_ID} variant="brand" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : "저장하기"}
        </Button>
      </>
    ),
    [getReturnToPath, isSubmitting, router],
  );

  usePageHeaderExtra(isLoading || loadError ? null : headerActions);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="입점신청 정보를 불러오는 중" />;
  }

  if (loadError || !detail) {
    return (
      <LoadErrorState
        title="입점신청 정보를 불러오지 못했습니다."
        message={loadError ?? "입점신청 정보를 찾을 수 없습니다."}
        onRetry={() => void fetchEntry()}
      />
    );
  }

  return (
    <form id={HOSPITAL_ENTRY_EDIT_FORM_ID} className="min-w-0 space-y-4" onSubmit={handleSubmit}>
      <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <HospitalEntryHospitalEditCard
          form={form}
          errors={errors}
          businessRegistrationMedia={existingBusinessRegistrationFile}
          licenseMedia={existingLicenseFile}
          businessRegistrationFile={businessRegistrationFile}
          licenseFile={licenseFile}
          businessFileInputRef={businessFileInputRef}
          licenseFileInputRef={licenseFileInputRef}
          onFieldChange={setField}
          onBusinessFileChange={(file) => {
            setBusinessRegistrationFile(file);
            clearError("business_registration_file");
          }}
          onLicenseFileChange={(file) => {
            setLicenseFile(file);
            clearError("license_file");
          }}
          onExistingBusinessFileChange={(hasFile) => {
            setExistingBusinessRegistrationFile(hasFile ? existingBusinessRegistrationFile : null);
            clearError("business_registration_file");
          }}
          onExistingLicenseFileChange={(hasFile) => {
            setExistingLicenseFile(hasFile ? existingLicenseFile : null);
            clearError("license_file");
          }}
          onPreview={setPreviewMedia}
        />
        <HospitalEntryApplicantEditCard form={form} errors={errors} onFieldChange={setField} />
      </section>

      <HospitalEntryAllowStatusReadonlyCard detail={detail} />

      <HospitalMediaPreviewModal
        preview={previewMedia}
        onChange={setPreviewMedia}
        onClose={() => setPreviewMedia(null)}
      />
    </form>
  );
}

function HospitalEntryHospitalEditCard({
  form,
  errors,
  businessRegistrationMedia,
  licenseMedia,
  businessRegistrationFile,
  licenseFile,
  businessFileInputRef,
  licenseFileInputRef,
  onFieldChange,
  onBusinessFileChange,
  onLicenseFileChange,
  onExistingBusinessFileChange,
  onExistingLicenseFileChange,
  onPreview,
}: {
  form: HospitalEntryFormValues;
  errors: HospitalEntryFormErrors;
  businessRegistrationMedia: HospitalEntryMediaAsset | null;
  licenseMedia: HospitalEntryMediaAsset | null;
  businessRegistrationFile: File | null;
  licenseFile: File | null;
  businessFileInputRef: React.RefObject<HTMLInputElement | null>;
  licenseFileInputRef: React.RefObject<HTMLInputElement | null>;
  onFieldChange: <K extends keyof HospitalEntryFormValues>(field: K, value: HospitalEntryFormValues[K]) => void;
  onBusinessFileChange: (file: File | null) => void;
  onLicenseFileChange: (file: File | null) => void;
  onExistingBusinessFileChange: (hasFile: boolean) => void;
  onExistingLicenseFileChange: (hasFile: boolean) => void;
  onPreview: (preview: HospitalMediaPreviewState) => void;
}) {
  return (
    <Card className={`${infoCardClassName} h-full min-h-[18rem]`}>
      <h2 className={`mb-6 ${cardTitleClassName}`}>병의원 정보</h2>
      <div className="space-y-5">
        <TextEditRow
          label="병의원명"
          required
          field="hospital_name"
          value={form.hospital_name}
          error={errors.hospital_name}
          onFieldChange={onFieldChange}
        />
        <TextEditRow
          label="전화번호"
          required
          field="hospital_phone"
          value={form.hospital_phone}
          error={errors.hospital_phone}
          onFieldChange={onFieldChange}
        />
        <TextEditRow
          label="주소"
          required
          field="address"
          value={form.address}
          error={errors.address}
          onFieldChange={onFieldChange}
        />
        <TextEditRow
          label="상세주소"
          field="address_detail"
          value={form.address_detail}
          error={errors.address_detail}
          onFieldChange={onFieldChange}
        />
        <TextEditRow
          label="사업자등록번호"
          required
          field="business_number"
          value={form.business_number}
          error={errors.business_number}
          onFieldChange={onFieldChange}
        />
        <FileEditRow
          label="사업자등록증"
          fieldName="business_registration_file"
          required
          title="사업자등록증"
          media={businessRegistrationMedia}
          selectedFile={businessRegistrationFile}
          error={errors.business_registration_file}
          inputRef={businessFileInputRef}
          onFileChange={onBusinessFileChange}
          onExistingFileChange={onExistingBusinessFileChange}
          onPreview={onPreview}
        />
        <TextEditRow
          label="대표자"
          required
          field="ceo_name"
          value={form.ceo_name}
          error={errors.ceo_name}
          onFieldChange={onFieldChange}
        />
        <TextEditRow
          label="의사면허번호"
          field="license_number"
          value={form.license_number}
          error={errors.license_number}
          onFieldChange={onFieldChange}
        />
        <FileEditRow
          label="의사면허증"
          fieldName="license_file"
          title="의사면허증"
          media={licenseMedia}
          selectedFile={licenseFile}
          error={errors.license_file}
          inputRef={licenseFileInputRef}
          onFileChange={onLicenseFileChange}
          onExistingFileChange={onExistingLicenseFileChange}
          onPreview={onPreview}
        />
      </div>
    </Card>
  );
}

function HospitalEntryApplicantEditCard({
  form,
  errors,
  onFieldChange,
}: {
  form: HospitalEntryFormValues;
  errors: HospitalEntryFormErrors;
  onFieldChange: <K extends keyof HospitalEntryFormValues>(field: K, value: HospitalEntryFormValues[K]) => void;
}) {
  return (
    <Card className={`${infoCardClassName} h-full min-h-[18rem]`}>
      <h2 className={`mb-6 ${cardTitleClassName}`}>신청자 정보</h2>
      <div className="space-y-5">
        <TextEditRow
          label="이름"
          required
          field="applicant_name"
          value={form.applicant_name}
          error={errors.applicant_name}
          onFieldChange={onFieldChange}
        />
        <TextEditRow
          label="직책"
          field="applicant_position"
          value={form.applicant_position}
          error={errors.applicant_position}
          onFieldChange={onFieldChange}
        />
        <TextEditRow
          label="이메일주소"
          field="applicant_email"
          type="email"
          value={form.applicant_email}
          error={errors.applicant_email}
          onFieldChange={onFieldChange}
        />
        <TextEditRow
          label="전화번호"
          field="applicant_phone"
          value={form.applicant_phone}
          error={errors.applicant_phone}
          onFieldChange={onFieldChange}
        />
      </div>
    </Card>
  );
}

function HospitalEntryAllowStatusReadonlyCard({ detail }: { detail: HospitalEntryDetailResponse }) {
  const status = resolveAllowStatusValue(detail.allow_status);

  return (
    <Card className={infoCardClassName}>
      <div className="flex min-h-[3.5rem] flex-wrap items-center gap-x-8 gap-y-3">
        <h2 className="text-sm font-bold text-gray-900">검수상태</h2>
        <StatusBadge size="sm" color={hospitalEntryAllowStatusColor(status)}>
          {labelHospitalEntryAllowStatus(status)}
        </StatusBadge>
      </div>
    </Card>
  );
}

function TextEditRow<K extends keyof HospitalEntryFormValues>({
  label,
  field,
  value,
  error,
  required = false,
  type = "text",
  onFieldChange,
}: {
  label: string;
  field: K;
  value: HospitalEntryFormValues[K];
  error?: string;
  required?: boolean;
  type?: string;
  onFieldChange: <T extends keyof HospitalEntryFormValues>(field: T, value: HospitalEntryFormValues[T]) => void;
}) {
  return (
    <FormRow label={label} required={required} error={error}>
      <InputField
        id={`hospital-entry-${String(field).replace(/_/g, "-")}`}
        name={field}
        type={type}
        value={value}
        error={Boolean(error)}
        className="h-9 bg-white px-3 py-1.5"
        onChange={(event) => onFieldChange(field, event.target.value as HospitalEntryFormValues[K])}
      />
    </FormRow>
  );
}

function FileEditRow({
  label,
  fieldName,
  title,
  media,
  selectedFile,
  error,
  required = false,
  inputRef,
  onFileChange,
  onExistingFileChange,
  onPreview,
}: {
  label: string;
  fieldName: Extract<HospitalEntryFieldName, "business_registration_file" | "license_file">;
  title: string;
  media: HospitalEntryMediaAsset | null;
  selectedFile: File | null;
  error?: string;
  required?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (file: File | null) => void;
  onExistingFileChange: (hasFile: boolean) => void;
  onPreview: (preview: HospitalMediaPreviewState) => void;
}) {
  const fileUrl = useObjectUrl(selectedFile);
  const existingUrl = resolveHospitalEntryMediaUrl(media);
  const previewUrl = fileUrl ?? existingUrl;
  const filename = selectedFile?.name ?? (media ? getHospitalEntryMediaFilename(media) : "");
  const hasFile = Boolean(selectedFile || media);
  const isPreviewImage = selectedFile ? selectedFile.type.startsWith("image/") : isHospitalEntryImageMedia(media);

  const clearFile = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    if (selectedFile) {
      onFileChange(null);
      return;
    }

    if (media) {
      onExistingFileChange(false);
    }
  };

  return (
    <FormRow label={label} required={required} error={error}>
      <input
        ref={inputRef}
        id={`hospital-entry-${fieldName.replace(/_/g, "-")}`}
        name={fieldName}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />
      <div className="min-w-0 space-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="brand"
            size="sm"
            className={fileSelectButtonClassName}
            onClick={() => inputRef.current?.click()}
          >
            파일선택
          </Button>
          {previewUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={fileSelectButtonClassName}
              onClick={() =>
                onPreview({
                  url: previewUrl,
                  title,
                  isImage: isPreviewImage,
                })
              }
            >
              원본보기
            </Button>
          ) : null}
        </div>
        {hasFile && filename ? (
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <span className="min-w-0 truncate text-xs font-medium text-gray-700">{filename}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-gray-500 hover:text-red-600"
              onClick={clearFile}
            >
              삭제
            </Button>
          </div>
        ) : null}
      </div>
    </FormRow>
  );
}

function FormRow({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[8.5rem_minmax(0,1fr)] items-start gap-4">
      <p className={labelClassName}>
        {label}
        {required ? <span className="text-error-500">*</span> : null}
      </p>
      <div>
        {children}
        {error ? <p className="mt-1 text-xs text-error-500">{error}</p> : null}
      </div>
    </div>
  );
}

function mapDetailToForm(detail: HospitalEntryDetailResponse): HospitalEntryFormValues {
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

function buildHospitalEntryFormData(
  form: HospitalEntryFormValues,
  businessRegistrationFile: File | null,
  licenseFile: File | null,
  existingBusinessRegistrationFile: HospitalEntryMediaAsset | null,
  existingLicenseFile: HospitalEntryMediaAsset | null,
) {
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

function hospitalEntryMediaId(media?: HospitalEntryMediaAsset | null) {
  return media?.id !== null && media?.id !== undefined ? String(media.id) : null;
}

function extractHospitalEntryFieldErrors(details: unknown): HospitalEntryFormErrors {
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

function normalizeHospitalEntryErrorField(key: string): HospitalEntryFieldName | null {
  const field = FIELD_NAMES.find((name) => key === name || key.startsWith(`${name}.`));
  return field ?? null;
}

function focusFirstError(errors: HospitalEntryFormErrors) {
  const firstField = FIELD_NAMES.find((field) => errors[field]);
  if (!firstField) return;

  const input = document.querySelector<HTMLElement>(
    `[name="${firstField}"], #hospital-entry-${firstField.replace(/_/g, "-")}`,
  );
  input?.focus();
}
