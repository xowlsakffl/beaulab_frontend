"use client";

import React from "react";

import { useDoctorHospitalOptions } from "@/hooks/doctor/useDoctorHospitalOptions";
import {
  DOCTOR_GENDER_OPTIONS,
  DOCTOR_POSITION_OPTIONS,
  DOCTOR_SPECIALIST_FIELD_OPTIONS,
  type DoctorFieldName,
  type DoctorFormErrors,
  type DoctorFormValues,
  type DoctorHospitalOption,
} from "@/lib/doctor/form";
import { doctorApprovalStatusBadgeColor, formatCareerPeriod, labelDoctorApprovalStatus } from "@/lib/doctor/list";
import {
  Card,
  InlineFileSelect,
  InputField,
  Label,
  Search,
  Select,
  SingleDatePickerField,
  SpinnerBlock,
  StatusBadge,
  type ExistingMediaItem,
} from "@beaulab/ui-admin";

const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const labelClassName = "pt-0.5 text-xs font-semibold text-gray-500";
const formControlClassName = "h-11 bg-white px-4 py-2.5";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function DoctorInfoEditorCard({
  form,
  errors,
  licenseImage,
  specialistCertificateImage,
  existingLicenseImage,
  existingSpecialistCertificateImage,
  onFieldChange,
  onSelectHospital,
  onClearHospital,
  onLicenseImageChange,
  onExistingLicenseImageChange,
  onSpecialistCertificateImageChange,
  onExistingSpecialistCertificateImageChange,
  showCurrentAllowStatus = false,
}: {
  form: DoctorFormValues;
  errors: DoctorFormErrors;
  licenseImage: File | null;
  specialistCertificateImage: File | null;
  existingLicenseImage: ExistingMediaItem | null;
  existingSpecialistCertificateImage: ExistingMediaItem | null;
  onFieldChange: <K extends keyof DoctorFormValues>(key: K, value: DoctorFormValues[K]) => void;
  onSelectHospital: (hospital: DoctorHospitalOption) => void;
  onClearHospital: () => void;
  onLicenseImageChange: (file: File | null) => void;
  onExistingLicenseImageChange: (file: ExistingMediaItem | null) => void;
  onSpecialistCertificateImageChange: (file: File | null) => void;
  onExistingSpecialistCertificateImageChange: (file: ExistingMediaItem | null) => void;
  showCurrentAllowStatus?: boolean;
}) {
  return (
    <Card className={cardClassName}>
      <div className="grid gap-x-8 gap-y-3 lg:grid-cols-2">
        <div className="space-y-3">
          <HospitalAutocompleteField
            selectedHospital={
              form.hospital_id
                ? {
                    id: form.hospital_id,
                    name: form.hospital_name,
                    business_number: form.hospital_business_number,
                  }
                : null
            }
            error={errors.hospital_id}
            onSelectHospital={onSelectHospital}
            onClearHospital={onClearHospital}
          />

          <EditField label="의료진" required error={errors.name} target="name">
            <InputField
              id="name"
              value={form.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
              placeholder="의료진명을 입력해 주세요."
              error={Boolean(errors.name)}
              className={formControlClassName}
            />
          </EditField>

          <EditField label="직책" required error={errors.position} target="position">
            <Select
              id="position"
              value={form.position}
              placeholder="의료진 직책을 선택해 주세요."
              options={[...DOCTOR_POSITION_OPTIONS]}
              onChange={(value) => onFieldChange("position", value)}
              className={cx(formControlClassName, errors.position ? "border-error-500" : "")}
            />
          </EditField>

          <EditField label="성별" required error={errors.gender} target="gender">
            <div className="grid grid-cols-2 gap-2">
              {DOCTOR_GENDER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onFieldChange("gender", option.value)}
                  className={cx(
                    "h-11 rounded-lg border text-sm font-semibold transition-colors",
                    form.gender === option.value
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-brand-200",
                    errors.gender ? "border-error-500" : "",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </EditField>
        </div>

        <div className="space-y-3">
          <CareerDateField
            value={form.career_started_at}
            onChange={(value) => onFieldChange("career_started_at", value)}
          />

          <EditField label="의사면허 번호" required error={errors.license_number} target="license_number">
            <div className="space-y-2">
              <InputField
                id="license_number"
                value={form.license_number}
                onChange={(event) => onFieldChange("license_number", event.target.value.replace(/\D/g, ""))}
                placeholder="의사면허 번호를 숫자만 입력해 주세요."
                error={Boolean(errors.license_number)}
                className={cx(formControlClassName, "min-w-0")}
              />
              <InlineFileSelect
                accept="image/jpeg,image/png,image/webp,application/pdf"
                fileName={licenseImage?.name ?? existingLicenseImage?.name ?? ""}
                placeholder="의사면허증 파일을 선택해 주세요."
                helperText="JPG, JPEG, PNG, WEBP, PDF / 10MB 이하"
                onChange={onLicenseImageChange}
                onClear={() => {
                  if (licenseImage) {
                    onLicenseImageChange(null);
                    return;
                  }

                  onExistingLicenseImageChange(null);
                }}
              />
            </div>
          </EditField>

          <EditField label="전문의" target="specialist_field">
            <div className="space-y-2">
              <Select
                id="specialist_field"
                value={form.specialist_field === "NONE" ? "" : form.specialist_field}
                placeholder="전문의 과목을 선택해 주세요."
                options={DOCTOR_SPECIALIST_FIELD_OPTIONS.filter((option) => option.value !== "NONE")}
                onChange={(value) => onFieldChange("specialist_field", value || "NONE")}
                className={formControlClassName}
              />
              <InlineFileSelect
                accept="image/jpeg,image/png,image/webp,application/pdf"
                fileName={specialistCertificateImage?.name ?? existingSpecialistCertificateImage?.name ?? ""}
                placeholder="전문의 자격증 파일을 선택해 주세요."
                helperText="JPG, JPEG, PNG, WEBP, PDF / 10MB 이하"
                onChange={onSpecialistCertificateImageChange}
                onClear={() => {
                  if (specialistCertificateImage) {
                    onSpecialistCertificateImageChange(null);
                    return;
                  }

                  onExistingSpecialistCertificateImageChange(null);
                }}
              />
            </div>
          </EditField>
          {showCurrentAllowStatus ? (
            <EditField label="검수상태" target="allow_status">
              <StatusBadge size="sm" color={doctorApprovalStatusBadgeColor(form.allow_status)}>
                {labelDoctorApprovalStatus(form.allow_status)}
              </StatusBadge>
            </EditField>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function HospitalAutocompleteField({
  selectedHospital,
  error,
  onSelectHospital,
  onClearHospital,
}: {
  selectedHospital: DoctorHospitalOption | null;
  error?: string;
  onSelectHospital: (hospital: DoctorHospitalOption) => void;
  onClearHospital: () => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState(selectedHospital?.name ?? "");
  const { options, isLoading, error: loadError } = useDoctorHospitalOptions(isOpen, query);
  const visibleOptions = options.slice(0, 3);
  const selectedHospitalId = selectedHospital?.id;
  const selectedHospitalName = selectedHospital?.name;

  React.useEffect(() => {
    if (!selectedHospitalName) return;
    setQuery(selectedHospitalName);
  }, [selectedHospitalId, selectedHospitalName]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <EditField label="병의원" required error={error} target="hospital_id">
      <div ref={containerRef} className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-gray-400" />
        <InputField
          id="hospital_id"
          value={query}
          onClick={() => setIsOpen(true)}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            if (selectedHospital && nextQuery !== selectedHospitalName) {
              onClearHospital();
            }
            setIsOpen(true);
          }}
          placeholder="소속 병의원명을 검색해 주세요."
          error={Boolean(error)}
          className={cx(formControlClassName, "pl-10")}
        />

        {isOpen ? (
          <Card className="absolute top-full right-0 left-0 z-[80] mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
            {isLoading ? (
              <div className="py-5">
                <SpinnerBlock className="min-h-0" spinnerClassName="size-5" label="병의원 검색 중" />
              </div>
            ) : loadError ? (
              <p className="px-3 py-4 text-sm text-error-500">{loadError}</p>
            ) : visibleOptions.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-500">검색 결과가 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {visibleOptions.map((hospital) => {
                  const businessNumber = hospital.business_number?.trim() || "-";

                  return (
                    <button
                      key={hospital.id}
                      type="button"
                      onClick={() => {
                        onSelectHospital(hospital);
                        setQuery(hospital.name);
                        setIsOpen(false);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left hover:bg-brand-50"
                    >
                      <span className="block truncate text-sm font-semibold text-gray-800">{hospital.name}</span>
                      <span className="block truncate text-xs text-gray-500">
                        HID {hospital.id} · 사업자등록번호 {businessNumber}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        ) : null}
      </div>
    </EditField>
  );
}

function CareerDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <EditField label="경력기간" target="career_started_at">
      <div className="space-y-1">
        <SingleDatePickerField
          id="career_started_at"
          value={value}
          placeholder="의사면허 발급일을 선택해 주세요."
          buttonClassName={cx(
            formControlClassName,
            "text-gray-800 hover:bg-white hover:text-gray-800 focus:border-brand-300 focus:ring-brand-500/10",
          )}
          onChange={onChange}
        />
        <InputField
          value={value ? formatCareerPeriod(value) : ""}
          placeholder="발급일 기준 경력기간이 자동 계산됩니다."
          readOnly
          className={cx(formControlClassName, "text-gray-800")}
        />
      </div>
    </EditField>
  );
}

function EditField({
  label,
  required = false,
  error,
  target,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  target?: DoctorFieldName;
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-start gap-4"
      data-field-target={target}
      tabIndex={target ? -1 : undefined}
    >
      <Label className={cx(labelClassName, "mb-0 pt-2")}>
        {label}
        {required ? <span className="ml-0.5 text-brand-500">*</span> : null}
      </Label>
      <div className="min-w-0">
        {children}
        {error ? <p className="mt-1.5 text-xs text-error-500">{error}</p> : null}
      </div>
    </div>
  );
}
