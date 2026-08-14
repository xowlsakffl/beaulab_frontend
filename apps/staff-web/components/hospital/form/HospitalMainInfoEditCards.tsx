"use client";

import React from "react";
import { Button, Card, InlineFileSelect, InputField, Select, StatusBadge } from "@beaulab/ui-admin";

import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { useObjectUrl } from "@/hooks/common/useObjectUrl";
import { BUSINESS_NUMBER_FORMATTED_LENGTH, formatBusinessNumberInput } from "@/lib/common/business-number";
import { BANK_OPTIONS } from "@/lib/common/banks";
import { hospitalStatusBadgeColor, labelApprovalStatus } from "@/lib/hospital/list";
import { getMediaFilename, isImageMedia, resolveMediaUrl, type MediaAsset } from "@/lib/hospital/detail";
import type {
  HospitalAddressDetailField,
  HospitalAddressField,
  HospitalFormErrors,
  HospitalFormValues,
} from "@/lib/hospital/form";

const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const labelClassName = "pt-0.5 text-xs font-semibold text-gray-500";
const readonlyValueClassName = "min-w-0 break-words text-sm leading-6 text-gray-800";

export function HospitalMainInfoEditCard({
  mode,
  form,
  errors,
  businessRegistrationFile,
  existingCertificate,
  className,
  onFieldChange,
  onNameChange,
  onNameBlur,
  onBusinessNumberChange,
  onBusinessNumberBlur,
  onBusinessRegistrationFileChange,
  onExistingCertificateChange,
  onOpenAddressSearch,
  onPreview,
}: {
  mode: "create" | "edit";
  form: HospitalFormValues;
  errors: HospitalFormErrors;
  businessRegistrationFile: File | null;
  existingCertificate: MediaAsset | null;
  className?: string;
  onFieldChange: (key: keyof HospitalFormValues, value: HospitalFormValues[keyof HospitalFormValues]) => void;
  onNameChange?: (value: string) => void;
  onNameBlur?: (value: string) => void;
  onBusinessNumberChange?: (value: string) => void;
  onBusinessNumberBlur?: (value: string) => void;
  onBusinessRegistrationFileChange: (file: File | null) => void;
  onExistingCertificateChange?: (hasFile: boolean) => void;
  onOpenAddressSearch: (field: HospitalAddressField, detailFieldId: HospitalAddressDetailField) => Promise<void>;
  onPreview: (preview: MediaPreviewState) => void;
}) {
  const isCreate = mode === "create";

  return (
    <Card className={[cardClassName, className].filter(Boolean).join(" ")}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold text-gray-900">병의원정보</h2>
          {!isCreate && form.status !== "ACTIVE" ? (
            <StatusBadge size="sm" color={hospitalStatusBadgeColor(form.status)}>
              {labelApprovalStatus(form.status)}
            </StatusBadge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
        <EditField label="병의원명" required error={errors.name}>
          {isCreate ? (
            <InputField
              id="name"
              name="name"
              value={form.name}
              placeholder="예: 뷰랩성형외과"
              onChange={(event) => onNameChange?.(event.target.value)}
              onBlur={(event) => onNameBlur?.(event.target.value)}
              error={Boolean(errors.name)}
              className="h-11 bg-white px-4 py-2.5"
            />
          ) : (
            <p id="name" className={readonlyValueClassName}>
              {form.name.trim() || "-"}
            </p>
          )}
        </EditField>
        <EditField label="대표자" required error={errors.ceo_name}>
          <InputField
            id="ceo_name"
            name="ceo_name"
            value={form.ceo_name}
            placeholder="사업자등록증 기준 대표자명을 입력해 주세요."
            onChange={(event) => onFieldChange("ceo_name", event.target.value)}
            error={Boolean(errors.ceo_name)}
            className="h-11 bg-white px-4 py-2.5"
          />
        </EditField>
        <EditField label="병의원주소" required error={errors.address} className="md:col-span-2">
          <div className="space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-2">
              <InputField
                id="address"
                name="address"
                value={form.address}
                placeholder="주소찾기로 병의원 주소를 선택해 주세요."
                readOnly
                onClick={() => void onOpenAddressSearch("address", "address_detail")}
                error={Boolean(errors.address)}
                className="h-11 cursor-pointer bg-white px-4 py-2.5"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11"
                onClick={() => void onOpenAddressSearch("address", "address_detail")}
              >
                주소찾기
              </Button>
            </div>
            <InputField
              id="address_detail"
              name="address_detail"
              value={form.address_detail}
              placeholder="건물명, 층수, 호수 등 상세주소를 입력해 주세요."
              onChange={(event) => onFieldChange("address_detail", event.target.value)}
              error={Boolean(errors.address_detail)}
              className="h-11 bg-white px-4 py-2.5"
            />
            {errors.address_detail ? <p className="text-xs text-error-500">{errors.address_detail}</p> : null}
          </div>
        </EditField>
        <EditField label="전화번호" required error={errors.tel}>
          <InputField
            id="tel"
            name="tel"
            value={form.tel}
            placeholder="대표 전화번호를 입력해 주세요."
            onChange={(event) => onFieldChange("tel", event.target.value)}
            error={Boolean(errors.tel)}
            className="h-11 bg-white px-4 py-2.5"
          />
        </EditField>
        <div />
        <EditField label="사업자등록번호" required error={errors.business_number}>
          <InputField
            id="business_number"
            name="business_number"
            value={form.business_number}
            placeholder="000-00-00000"
            inputMode="numeric"
            maxLength={BUSINESS_NUMBER_FORMATTED_LENGTH}
            onChange={(event) => {
              const value = formatBusinessNumberInput(event.target.value);

              if (isCreate) {
                onBusinessNumberChange?.(value);
                return;
              }
              onFieldChange("business_number", value);
            }}
            onBlur={(event) => onBusinessNumberBlur?.(event.target.value)}
            error={Boolean(errors.business_number)}
            className="h-11 bg-white px-4 py-2.5"
          />
        </EditField>
        <BusinessCertificateEditField
          file={businessRegistrationFile}
          existingCertificate={existingCertificate}
          error={errors.business_registration_file}
          onFileChange={onBusinessRegistrationFileChange}
          onExistingCertificateChange={onExistingCertificateChange}
          onPreview={onPreview}
        />
        <EditField label="업태" required error={errors.business_type}>
          <InputField
            id="business_type"
            name="business_type"
            value={form.business_type}
            placeholder="사업자등록증의 업태를 입력해 주세요."
            onChange={(event) => onFieldChange("business_type", event.target.value)}
            error={Boolean(errors.business_type)}
            className="h-11 bg-white px-4 py-2.5"
          />
        </EditField>
        <EditField label="종목" required error={errors.business_item}>
          <InputField
            id="business_item"
            name="business_item"
            value={form.business_item}
            placeholder="사업자등록증의 종목을 입력해 주세요."
            onChange={(event) => onFieldChange("business_item", event.target.value)}
            error={Boolean(errors.business_item)}
            className="h-11 bg-white px-4 py-2.5"
          />
        </EditField>
        <EditField label="유튜브 링크" error={errors.youtube_link} className="md:col-span-2">
          <InputField
            id="youtube_link"
            name="youtube_link"
            type="url"
            value={form.youtube_link}
            placeholder="https://www.youtube.com/@..."
            onChange={(event) => onFieldChange("youtube_link", event.target.value)}
            error={Boolean(errors.youtube_link)}
            className="h-11 bg-white px-4 py-2.5"
          />
        </EditField>
      </div>
    </Card>
  );
}

export function HospitalBusinessAccountEditCard({
  form,
  errors,
  className,
  onFieldChange,
}: {
  form: HospitalFormValues;
  errors: HospitalFormErrors;
  className?: string;
  onFieldChange: (key: keyof HospitalFormValues, value: HospitalFormValues[keyof HospitalFormValues]) => void;
}) {
  return (
    <Card className={[cardClassName, className].filter(Boolean).join(" ")}>
      <h3 className="mb-5 text-sm font-bold text-gray-900">사업자 계좌정보</h3>
      <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
        <EditField label="세금계산서 이메일" error={errors.tax_invoice_email} className="md:col-span-2">
          <InputField
            id="tax_invoice_email"
            name="tax_invoice_email"
            type="email"
            value={form.tax_invoice_email}
            placeholder="세금계산서를 수신할 이메일을 입력해 주세요."
            onChange={(event) => onFieldChange("tax_invoice_email", event.target.value)}
            error={Boolean(errors.tax_invoice_email)}
            className="h-11 bg-white px-4 py-2.5"
          />
        </EditField>
        <EditField label="정산 계좌번호" error={errors.settlement_account_number}>
          <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2">
            <Select
              id="settlement_bank_name"
              value={form.settlement_bank_name}
              placeholder="정산은행"
              options={BANK_OPTIONS}
              onChange={(value) => onFieldChange("settlement_bank_name", value)}
              className="h-11 bg-white px-4 py-2.5"
            />
            <InputField
              id="settlement_account_number"
              name="settlement_account_number"
              value={form.settlement_account_number}
              placeholder="정산받을 계좌번호"
              onChange={(event) => onFieldChange("settlement_account_number", event.target.value)}
              error={Boolean(errors.settlement_account_number)}
              className="h-11 bg-white px-4 py-2.5"
            />
          </div>
        </EditField>
        <EditField label="예금주명" error={errors.settlement_account_holder}>
          <InputField
            id="settlement_account_holder"
            name="settlement_account_holder"
            value={form.settlement_account_holder}
            placeholder="계좌 예금주명을 입력해 주세요."
            onChange={(event) => onFieldChange("settlement_account_holder", event.target.value)}
            error={Boolean(errors.settlement_account_holder)}
            className="h-11 bg-white px-4 py-2.5"
          />
        </EditField>
      </div>
    </Card>
  );
}

function BusinessCertificateEditField({
  file,
  existingCertificate,
  error,
  onFileChange,
  onExistingCertificateChange,
  onPreview,
}: {
  file: File | null;
  existingCertificate: MediaAsset | null;
  error?: string;
  onFileChange: (file: File | null) => void;
  onExistingCertificateChange?: (hasFile: boolean) => void;
  onPreview: (preview: MediaPreviewState) => void;
}) {
  const fileUrl = useObjectUrl(file);
  const existingUrl = resolveMediaUrl(existingCertificate);
  const previewUrl = fileUrl ?? existingUrl;
  const filename = file?.name ?? (existingCertificate ? getMediaFilename(existingCertificate) : "");
  const isPreviewImage = file ? file.type.startsWith("image/") : isImageMedia(existingCertificate);

  const clearFile = () => {
    if (file) {
      onFileChange(null);
      return;
    }

    if (existingCertificate) {
      onExistingCertificateChange?.(false);
    }
  };

  return (
    <EditField label="사업자등록증" required error={error}>
      <InlineFileSelect
        id="business_registration_file"
        name="business_registration_file"
        accept=".jpg,.jpeg,.png,.pdf"
        fileName={filename}
        placeholder="사업자등록증 파일을 선택해 주세요."
        helperText="JPG, JPEG, PNG, PDF / 10MB 이하"
        error={Boolean(error)}
        onChange={onFileChange}
        onPreview={
          previewUrl
            ? () =>
                onPreview({
                  url: previewUrl,
                  title: "사업자등록증",
                  isImage: isPreviewImage,
                })
            : undefined
        }
        onClear={filename ? clearFile : undefined}
      />
    </EditField>
  );
}

function EditField({
  label,
  required = false,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["grid grid-cols-[8.5rem_minmax(0,1fr)] items-start gap-4", className].filter(Boolean).join(" ")}>
      <p className={labelClassName}>
        {label}
        {required ? <RequiredMark /> : null}
      </p>
      <div>
        {children}
        {error ? <p className="mt-1 text-xs text-error-500">{error}</p> : null}
      </div>
    </div>
  );
}

function RequiredMark() {
  return <span className="text-error-500">*</span>;
}
