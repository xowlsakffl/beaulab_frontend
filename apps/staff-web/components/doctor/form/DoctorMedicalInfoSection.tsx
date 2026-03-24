import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  FormFileInput,
  InputField,
  Label,
  SingleDatePickerField,
  X,
} from "@beaulab/ui-admin";

import { formatCareerPeriod } from "@/lib/doctor/list";
import {
  DOCTOR_SPECIALIST_OPTIONS,
  type DoctorFormErrors,
  type DoctorFormValues,
} from "@/lib/doctor/form";

type ExistingDoctorFile = {
  id: string | number;
  name: string;
  url: string;
  size?: number | null;
};

type DoctorMedicalInfoSectionProps = {
  form: DoctorFormValues;
  errors: DoctorFormErrors;
  licenseImage: File | null;
  specialistCertificateImage: File | null;
  educationCertificateImages: File[];
  etcCertificateImages: File[];
  existingLicenseImage?: ExistingDoctorFile | null;
  existingSpecialistCertificateImage?: ExistingDoctorFile | null;
  existingEducationCertificateImages?: ExistingDoctorFile[];
  existingEtcCertificateImages?: ExistingDoctorFile[];
  onFieldChange: (key: keyof DoctorFormValues, value: DoctorFormValues[keyof DoctorFormValues]) => void;
  onLicenseImageChange: (file: File | null) => void;
  onSpecialistCertificateImageChange: (file: File | null) => void;
  onEducationCertificateImagesChange: (files: File[]) => void;
  onEtcCertificateImagesChange: (files: File[]) => void;
};

export function DoctorMedicalInfoSection({
  form,
  errors,
  licenseImage,
  specialistCertificateImage,
  educationCertificateImages,
  etcCertificateImages,
  existingLicenseImage,
  existingSpecialistCertificateImage,
  existingEducationCertificateImages = [],
  existingEtcCertificateImages = [],
  onFieldChange,
  onLicenseImageChange,
  onSpecialistCertificateImageChange,
  onEducationCertificateImagesChange,
  onEtcCertificateImagesChange,
}: DoctorMedicalInfoSectionProps) {
  return (
    <Card as="aside">
      <CardHeader className="pb-6">
        <CardTitle>의사 정보</CardTitle>
        <CardDescription>면허, 경력, 증빙 파일을 등록해 주세요.</CardDescription>
      </CardHeader>

      <div className="space-y-6">

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_140px]">
          <SingleDatePickerField
            id="career_started_at"
            label="경력 시작일"
            value={form.career_started_at}
            error={errors.career_started_at}
            onChange={(value) => onFieldChange("career_started_at", value)}
          />

          <div className="space-y-2">
            <Label htmlFor="career_period">경력기간</Label>
            <InputField
              id="career_period"
              value={formatCareerPeriod(form.career_started_at)}
              readOnly
              className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="license_number">의사면허증 번호</Label>
          <InputField
            id="license_number"
            name="license_number"
            value={form.license_number}
            onChange={(event) => onFieldChange("license_number", event.target.value)}
            placeholder="의사면허증 번호를 입력해 주세요."
            error={Boolean(errors.license_number)}
            hint={errors.license_number}
          />
        </div>

        <DoctorOptionButtonGroup
          id="is_specialist"
          label="전문의"
          value={form.is_specialist}
          options={DOCTOR_SPECIALIST_OPTIONS}
          error={errors.is_specialist}
          onChange={(value) => onFieldChange("is_specialist", value)}
        />

        <DoctorFileCollectionField
          id="license_image"
          label="의사면허증 이미지"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          files={licenseImage ? [licenseImage] : []}
          existingFiles={existingLicenseImage ? [existingLicenseImage] : []}
          error={errors.license_image}
          description={existingLicenseImage ? "새 파일 선택 시 기존 파일이 교체됩니다. jpg, png, webp, pdf / 최대 10MB" : "jpg, png, webp, pdf / 최대 10MB"}
          onChange={(files) => onLicenseImageChange(files[0] ?? null)}
        />

        <DoctorFileCollectionField
          id="specialist_certificate_image"
          label="전문의 증명서 이미지"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          files={specialistCertificateImage ? [specialistCertificateImage] : []}
          existingFiles={existingSpecialistCertificateImage ? [existingSpecialistCertificateImage] : []}
          error={errors.specialist_certificate_image}
          description={
            existingSpecialistCertificateImage
              ? "새 파일 선택 시 기존 파일이 교체됩니다. 전문의인 경우 관련 증명서를 첨부해 주세요."
              : "전문의인 경우 관련 증명서를 첨부해 주세요. 1개 파일만 업로드할 수 있습니다."
          }
          onChange={(files) => onSpecialistCertificateImageChange(files[0] ?? null)}
        />

        <DoctorRepeaterField
          id="educations"
          label="학력 사항"
          placeholder="예: 서울대학교 의과대학 졸업"
          values={form.educations}
          error={errors.educations}
          onChange={(values) => onFieldChange("educations", values)}
        />

        <DoctorFileCollectionField
          id="education_certificate_image"
          label="졸업/학력 증명서 이미지"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          files={educationCertificateImages}
          existingFiles={existingEducationCertificateImages}
          error={errors.education_certificate_image}
          description={
            existingEducationCertificateImages.length > 0
              ? "새 파일 선택 시 기존 파일 전체가 교체됩니다. 최대 5개"
              : "학력 관련 증빙 파일을 첨부해 주세요. 최대 5개"
          }
          multiple
          maxFiles={5}
          onChange={onEducationCertificateImagesChange}
        />

        <DoctorRepeaterField
          id="careers"
          label="경력 사항"
          placeholder="예: 전)뷰랩성형외과 원장"
          values={form.careers}
          error={errors.careers}
          onChange={(values) => onFieldChange("careers", values)}
        />

        <DoctorRepeaterField
          id="etc_contents"
          label="활동 사항"
          placeholder="예: 대한성형외과학회 정회원"
          values={form.etc_contents}
          error={errors.etc_contents}
          onChange={(values) => onFieldChange("etc_contents", values)}
        />

        <DoctorFileCollectionField
          id="etc_certificate_image"
          label="활동/기타 증명서"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          files={etcCertificateImages}
          existingFiles={existingEtcCertificateImages}
          error={errors.etc_certificate_image}
          description={
            existingEtcCertificateImages.length > 0
              ? "새 파일 선택 시 기존 파일 전체가 교체됩니다. 최대 5개"
              : "활동 사항 또는 기타 증빙 파일을 첨부해 주세요. 최대 5개"
          }
          multiple
          maxFiles={5}
          onChange={onEtcCertificateImagesChange}
        />
      </div>
    </Card>
  );
}

function DoctorOptionButtonGroup<T extends string | boolean>({
  id,
  label,
  required = false,
  error,
  value,
  options,
  columns = 2,
  onChange,
}: {
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  value: T | "";
  options: readonly {
    value: T;
    label: string;
  }[];
  columns?: 2 | 3;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2" data-field-target={id} tabIndex={-1}>
      <Label htmlFor={id}>
        {label}
        {required ? " *" : null}
      </Label>
      <div className={`grid gap-3 ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              key={String(option.value)}
              id={id ? `${id}-${String(option.value)}` : undefined}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(option.value)}
              className={[
                "h-11 w-full rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                isSelected
                  ? "border-[#f58bb6] bg-[#f58bb6] text-white focus-visible:ring-[#f58bb6]"
                  : "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error ? <p className="text-xs text-error-500">{error}</p> : null}
    </div>
  );
}

function DoctorRepeaterField({
  id,
  label,
  placeholder,
  values,
  error,
  addLabel = "추가",
  removeLabel = "삭제",
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  values: string[];
  error?: string;
  addLabel?: string;
  removeLabel?: string;
  onChange: (values: string[]) => void;
}) {
  const rows = values.length > 0 ? values : [""];
  const canAddMore = rows.length < 10;

  const updateValue = (index: number, nextValue: string) => {
    const nextRows = [...rows];
    nextRows[index] = nextValue;
    onChange(nextRows);
  };

  const addRow = () => {
    onChange([...rows, ""]);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  };

  return (
    <div className="space-y-2" data-field-target={id} tabIndex={-1}>
      <Label htmlFor={`${id}-0`}>{label}</Label>
      <div className="space-y-2">
        {rows.map((value, index) => (
          <div key={`${id}-${index}`} className="flex items-stretch gap-2">
            <div className="min-w-0 flex-1">
              <InputField
                id={`${id}-${index}`}
                value={value}
                placeholder={placeholder}
                onChange={(event) => updateValue(index, event.target.value)}
                error={Boolean(error)}
              />
            </div>

            {index === 0 ? (
              <Button
                type="button"
                variant="brand"
                size="auth"
                className="w-[88px] shrink-0 px-2"
                onClick={addRow}
                disabled={!canAddMore}
              >
                {addLabel}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="auth"
                className="w-[88px] shrink-0 border-red-500 px-2 text-red-500 hover:bg-red-50"
                onClick={() => removeRow(index)}
              >
                {removeLabel}
              </Button>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">최대 10개까지 입력할 수 있습니다.</p>
      {error ? <p className="text-xs text-error-500">{error}</p> : null}
    </div>
  );
}

function DoctorFileCollectionField({
  id,
  label,
  accept,
  description,
  files,
  existingFiles = [],
  error,
  multiple = false,
  maxFiles,
  onChange,
}: {
  id: string;
  label: string;
  accept: string;
  description: string;
  files: File[];
  existingFiles?: ExistingDoctorFile[];
  error?: string;
  multiple?: boolean;
  maxFiles?: number;
  onChange: (files: File[]) => void;
}) {
  const reachedLimit = typeof maxFiles === "number" && files.length >= maxFiles;

  return (
    <div className="space-y-2" data-field-target={id} tabIndex={-1}>
      <Label htmlFor={id}>{label}</Label>
      <FormFileInput
        id={id}
        accept={accept}
        multiple={multiple}
        disabled={reachedLimit}
        onChange={(event) => {
          const incomingFiles = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = "";

          if (incomingFiles.length === 0) {
            return;
          }

          onChange(multiple ? [...files, ...incomingFiles].slice(0, maxFiles ?? Number.POSITIVE_INFINITY) : [incomingFiles[0]]);
        }}
      />
      <p className={`text-xs ${error ? "text-error-500" : "text-gray-500 dark:text-gray-400"}`}>{error || description}</p>

      {existingFiles.length > 0 && files.length === 0 ? (
        <div className="space-y-2">
          {existingFiles.map((file) => (
            <div
              key={String(file.id)}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/60 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {[file.size ? formatBytes(file.size) : null, "현재 파일"].filter(Boolean).join(" · ")}
                </p>
              </div>
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-sm font-medium text-brand-500 underline underline-offset-2"
              >
                파일 보기
              </a>
            </div>
          ))}
        </div>
      ) : null}

      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/60 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-gray-500 hover:text-red-600"
                onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}
                title="파일 제거"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}
