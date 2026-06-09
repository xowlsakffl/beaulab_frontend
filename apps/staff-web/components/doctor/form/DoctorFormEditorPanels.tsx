"use client";

import React from "react";

import { AddCircleButton } from "@/components/common/AddCircleButton";
import type { HospitalMediaPreviewState } from "@/components/hospital/media/HospitalMediaPreviewModal";
import { useDoctorHospitalOptions } from "@/hooks/doctor/useDoctorHospitalOptions";
import type { DoctorCategoryItem } from "@/lib/doctor/detail";
import { formatCareerPeriod } from "@/lib/doctor/list";
import {
  DOCTOR_GENDER_OPTIONS,
  DOCTOR_POSITION_OPTIONS,
  DOCTOR_SPECIALIST_FIELD_OPTIONS,
  MAX_DOCTOR_TEXT_ITEM_COUNT,
  type DoctorFieldName,
  type DoctorFormErrors,
  type DoctorFormValues,
  type DoctorHospitalOption,
} from "@/lib/doctor/form";
import {
  Button,
  Card,
  ChevronDown,
  InputField,
  Label,
  Search,
  Select,
  SingleDatePickerField,
  SpinnerBlock,
  X,
  type CategorySelectorItem,
  type ExistingMediaItem,
} from "@beaulab/ui-admin";

const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const PROFILE_IMAGE_ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PROFILE_IMAGE_ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const PROFILE_IMAGE_VALIDATION_MESSAGE =
  "프로필 이미지는 아래 조건에 맞는 파일만 업로드할 수 있습니다.\n\n- 파일 형식: JPG, PNG, WEBP\n- 파일 용량: 5MB 이하\n- 이미지 비율: 1:1";
export const MAX_DOCTOR_CATEGORY_SELECTION = 5;

const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const labelClassName = "pt-0.5 text-xs font-semibold text-gray-500";
const formControlClassName = "h-9 bg-white px-3 py-1.5";
const fileSelectButtonClassName = "h-9 w-full px-3 text-xs";
const formDropdownButtonClassName =
  "flex h-9 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700";

export type DoctorCategoryOption = CategorySelectorItem & {
  domain?: string | null;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ProfileImageEditor({
  file,
  existingImage,
  error,
  onPreview,
  onChange,
}: {
  file: File | null;
  existingImage: ExistingMediaItem | null;
  error?: string;
  onPreview: (preview: HospitalMediaPreviewState) => void;
  onChange: (file: File | null) => void | Promise<void>;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const filePreviewUrl = useObjectUrl(file);
  const previewUrl = filePreviewUrl ?? existingImage?.url ?? null;

  return (
    <Card
      className={cx(
        "flex w-full flex-col self-start rounded-xl border bg-white p-4",
        error ? "border-error-500" : "border-gray-200",
      )}
      data-media-collection="profile_image"
      tabIndex={-1}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const nextFile = event.target.files?.[0] ?? null;
          event.currentTarget.value = "";
          void onChange(nextFile);
        }}
      />

      {previewUrl ? (
        <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-white">
          <button
            type="button"
            className="flex h-full w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl"
            onClick={() =>
              onPreview({
                url: previewUrl,
                title: "의료진 프로필",
                isImage: true,
              })
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- runtime storage/object URL */}
            <img src={previewUrl} alt="의료진 프로필" className="h-full w-full object-cover" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white px-6 text-center transition-colors hover:border-brand-200 hover:bg-brand-50/30"
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <span className="text-2xl leading-none">+</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-800">프로필 사진을 등록해 주세요.</p>
            <p className="text-xs text-gray-500">jpg, png, webp 파일을 업로드할 수 있습니다.</p>
          </div>
        </button>
      )}

      {previewUrl ? (
        <Button type="button" variant="brand" size="sm" className="mt-3 w-full" onClick={() => inputRef.current?.click()}>
          이미지 수정하기
        </Button>
      ) : (
        <Button type="button" variant="brand" size="sm" className="mt-3 w-full" onClick={() => inputRef.current?.click()}>
          이미지 등록하기
        </Button>
      )}
      {error ? <p className="mt-2 text-xs text-error-500">{error}</p> : null}
    </Card>
  );
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
                    "h-9 rounded-lg border text-sm font-semibold transition-colors",
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
          <CareerDateField value={form.career_started_at} onChange={(value) => onFieldChange("career_started_at", value)} />

          <EditField label="의사면허 번호" required error={errors.license_number} target="license_number">
            <div className="space-y-2">
              <div className="grid grid-cols-[minmax(0,1fr)_4.75rem] gap-2">
                <InputField
                  id="license_number"
                  value={form.license_number}
                  onChange={(event) => onFieldChange("license_number", event.target.value.replace(/\D/g, ""))}
                  placeholder="의사면허 번호를 숫자만 입력해 주세요."
                  error={Boolean(errors.license_number)}
                  className={cx(formControlClassName, "min-w-0")}
                />
                <FileSelectButton
                  label="파일선택"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={onLicenseImageChange}
                />
              </div>
              <SelectedFileRow
                file={licenseImage}
                existingFile={existingLicenseImage}
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
              <div className="grid grid-cols-[minmax(0,1fr)_4.75rem] gap-2">
                <Select
                  id="specialist_field"
                  value={form.specialist_field === "NONE" ? "" : form.specialist_field}
                  placeholder="전문의 과목을 선택해 주세요."
                  options={DOCTOR_SPECIALIST_FIELD_OPTIONS.filter((option) => option.value !== "NONE")}
                  onChange={(value) => onFieldChange("specialist_field", value || "NONE")}
                  className={formControlClassName}
                />
                <FileSelectButton
                  label="파일선택"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={onSpecialistCertificateImageChange}
                />
              </div>
              <SelectedFileRow
                file={specialistCertificateImage}
                existingFile={existingSpecialistCertificateImage}
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
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
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
          <Card className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
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

function CareerDateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
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

export function CategorySelectPanel({
  selectedIds,
  selectedItems,
  options,
  isLoading,
  loadError,
  error,
  onToggleCategory,
}: {
  selectedIds: number[];
  selectedItems: DoctorCategoryItem[];
  options: DoctorCategoryOption[];
  isLoading: boolean;
  loadError: string | null;
  error?: string;
  onToggleCategory: (categoryId: number, checked: boolean) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const optionMap = React.useMemo(() => new Map(options.map((option) => [option.id, option])), [options]);
  const selectedItemMap = React.useMemo(() => new Map(selectedItems.map((item) => [item.id, item])), [selectedItems]);
  const selectedDisplayItems = selectedIds
    .map((categoryId) => optionMap.get(categoryId) ?? selectedItemMap.get(categoryId))
    .filter((item): item is DoctorCategoryOption | DoctorCategoryItem => Boolean(item));

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
    <Card className={cx(cardClassName, error ? "border-error-500" : "")} data-field-target="category_ids" tabIndex={-1}>
      <div ref={containerRef} className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-900">진료분야</h3>
          <span className="text-xs text-gray-500">
            선택 {selectedIds.length}/{MAX_DOCTOR_CATEGORY_SELECTION}
          </span>
        </div>

        <div className={cx("min-h-20 rounded-xl border bg-white p-2", error ? "border-error-500" : "border-gray-200")}>
          {selectedDisplayItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedDisplayItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleCategory(item.id, false)}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
                >
                  <X className="size-3" />
                  {item.name}
                </button>
              ))}
            </div>
          ) : (
            <span className="px-1 py-2 text-sm text-gray-400">선택된 진료분야가 없습니다.</span>
          )}
        </div>

        <div className="relative">
          <button type="button" onClick={() => setIsOpen((prev) => !prev)} className={formDropdownButtonClassName}>
            전체
            <ChevronDown className="size-4 text-gray-500" />
          </button>

          {isOpen ? (
            <Card className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              {isLoading ? (
                <div className="py-5">
                  <SpinnerBlock className="min-h-0" spinnerClassName="size-5" label="진료분야 불러오는 중" />
                </div>
              ) : loadError ? (
                <p className="px-3 py-4 text-sm text-error-500">{loadError}</p>
              ) : options.length === 0 ? (
                <p className="px-3 py-4 text-sm text-gray-500">선택 가능한 진료분야가 없습니다.</p>
              ) : (
                <div className="space-y-1">
                  {options.map((option) => {
                    const isSelected = selectedIds.includes(option.id);

                    return (
                      <button
                        key={`${option.domain ?? "category"}:${option.id}`}
                        type="button"
                        onClick={() => onToggleCategory(option.id, !isSelected)}
                        className={cx(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                          isSelected ? "bg-brand-50 font-semibold text-brand-700" : "text-gray-700 hover:bg-gray-50",
                        )}
                      >
                        {option.name}
                        {isSelected ? <span className="text-xs">선택됨</span> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          ) : null}
        </div>

        {error ? <p className="text-xs text-error-500">{error}</p> : null}
      </div>
    </Card>
  );
}

export function RepeaterPanel({
  title,
  field,
  values,
  error,
  onChange,
}: {
  title: string;
  field: DoctorFieldName;
  values: string[];
  error?: string;
  onChange: (values: string[]) => void;
}) {
  const displayValues = values.length > 0 ? values : [""];
  const canAddItem = displayValues.length < MAX_DOCTOR_TEXT_ITEM_COUNT;

  const updateValue = (index: number, value: string) => {
    const nextValues = [...displayValues];
    nextValues[index] = value;
    onChange(nextValues);
  };

  const removeValue = (index: number) => {
    if (displayValues.length <= 1) return;
    onChange(displayValues.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <Card className={cardClassName} data-field-target={field} tabIndex={-1}>
      <div className="flex min-h-48 flex-col">
        <h3 className="mb-4 text-sm font-bold text-gray-900">{title}</h3>
        <div className="flex-1 space-y-2">
          {displayValues.map((value, index) => (
            <div key={`${field}-${index}`} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <InputField
                  value={value}
                  onChange={(event) => updateValue(index, event.target.value)}
                  placeholder={`${title}을 입력해 주세요.`}
                  className={formControlClassName}
                />
              </div>
              {index > 0 ? (
                <button
                  type="button"
                  onClick={() => removeValue(index)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                  aria-label={`${title} 삭제`}
                >
                  <X className="size-4" />
                </button>
              ) : (
                <span className="size-7 shrink-0" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>

        <AddCircleButton
          label={`${title} 추가`}
          onClick={() => {
            if (!canAddItem) return;
            onChange([...displayValues, ""]);
          }}
          disabled={!canAddItem}
          className="mx-auto mt-3 disabled:cursor-not-allowed disabled:opacity-40"
        />
        {!canAddItem ? (
          <p className="mt-2 text-center text-xs text-gray-500">최대 {MAX_DOCTOR_TEXT_ITEM_COUNT}개까지 입력할 수 있습니다.</p>
        ) : null}
        {error ? <p className="mt-2 text-xs text-error-500">{error}</p> : null}
      </div>
    </Card>
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
    <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-start gap-4" data-field-target={target} tabIndex={target ? -1 : undefined}>
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

function FileSelectButton({
  label,
  accept,
  onChange,
}: {
  label: string;
  accept: string;
  onChange: (file: File | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          onChange(event.target.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
      />
      <Button
        type="button"
        variant="brand"
        size="sm"
        className={fileSelectButtonClassName}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
    </>
  );
}

function SelectedFileRow({
  file,
  existingFile,
  onClear,
}: {
  file: File | null;
  existingFile: ExistingMediaItem | null;
  onClear: () => void;
}) {
  const filename = file?.name ?? existingFile?.name ?? "";

  if (!filename) return null;

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <span className="min-w-0 truncate text-xs font-medium text-gray-700">{filename}</span>
      <button type="button" onClick={onClear} className="shrink-0 text-xs font-semibold text-gray-500 hover:text-red-600">
        삭제
      </button>
    </div>
  );
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

export async function validateProfileImageFile(file: File) {
  if (!isValidProfileImageType(file)) {
    return PROFILE_IMAGE_VALIDATION_MESSAGE;
  }

  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    return PROFILE_IMAGE_VALIDATION_MESSAGE;
  }

  const isSquare = await isSquareImage(file);
  if (!isSquare) {
    return PROFILE_IMAGE_VALIDATION_MESSAGE;
  }

  return null;
}

function isValidProfileImageType(file: File) {
  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = PROFILE_IMAGE_ALLOWED_IMAGE_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
  const hasAllowedMimeType = !file.type || PROFILE_IMAGE_ALLOWED_IMAGE_TYPES.has(file.type);

  return hasAllowedExtension && hasAllowedMimeType;
}

function isSquareImage(file: File) {
  return new Promise<boolean>((resolve) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image.naturalWidth === image.naturalHeight);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(false);
    };

    image.src = objectUrl;
  });
}
