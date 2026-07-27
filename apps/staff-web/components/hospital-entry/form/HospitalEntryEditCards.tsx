"use client";

import React from "react";
import { Button, Card, InputField, StatusBadge } from "@beaulab/ui-admin";

import { resolveAllowStatusValue } from "@/components/common/AllowStatusControls";
import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { useObjectUrl } from "@/hooks/common/useObjectUrl";
import {
  getHospitalEntryMediaFilename,
  isHospitalEntryImageMedia,
  resolveHospitalEntryMediaUrl,
  type HospitalEntryDetailResponse,
  type HospitalEntryMediaAsset,
} from "@/lib/hospital-entry/detail";
import {
  type HospitalEntryFieldName,
  type HospitalEntryFormErrors,
  type HospitalEntryFormValues,
} from "@/lib/hospital-entry/form";
import { hospitalEntryAllowStatusColor, labelHospitalEntryAllowStatus } from "@/lib/hospital-entry/list";

const infoCardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const cardTitleClassName = "text-sm font-semibold text-gray-800";
const labelClassName = "pt-0.5 text-xs font-semibold text-gray-500";
const fileSelectButtonClassName = "h-8 px-3 text-xs";

export function HospitalEntryHospitalEditCard({
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
  onPreview: (preview: MediaPreviewState) => void;
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

export function HospitalEntryApplicantEditCard({
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

export function HospitalEntryAllowStatusReadonlyCard({ detail }: { detail: HospitalEntryDetailResponse }) {
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
  onPreview: (preview: MediaPreviewState) => void;
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
