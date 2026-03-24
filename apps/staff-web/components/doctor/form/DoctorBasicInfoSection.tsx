import React from "react";

import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  type ExistingMediaItem,
  InputField,
  Label,
  MediaUploader,
  Search,
  Select,
  SpinnerBlock,
} from "@beaulab/ui-admin";

import { useDoctorHospitalOptions } from "@/hooks/doctor/useDoctorHospitalOptions";
import {
  DOCTOR_ALLOW_STATUS_OPTIONS,
  DOCTOR_GENDER_OPTIONS,
  DOCTOR_POSITION_OPTIONS,
  DOCTOR_PROFILE_COLLECTIONS,
  DOCTOR_STATUS_OPTIONS,
  type DoctorFormErrors,
  type DoctorFormValues,
  type DoctorHospitalOption,
} from "@/lib/doctor/form";

type DoctorBasicInfoSectionProps = {
  form: DoctorFormValues;
  errors: DoctorFormErrors;
  profileImage: File | null;
  existingProfileImage?: ExistingMediaItem | null;
  hospitalSelectionMode?: "search" | "readonly";
  showStatusFields?: boolean;
  onFieldChange: (key: keyof DoctorFormValues, value: DoctorFormValues[keyof DoctorFormValues]) => void;
  onSelectHospital: (hospital: DoctorHospitalOption) => void;
  onProfileImageChange: (file: File | null) => void;
};

export function DoctorBasicInfoSection({
  form,
  errors,
  profileImage,
  existingProfileImage,
  hospitalSelectionMode = "search",
  showStatusFields = false,
  onFieldChange,
  onSelectHospital,
  onProfileImageChange,
}: DoctorBasicInfoSectionProps) {
  const selectedHospital = form.hospital_id
    ? {
        id: form.hospital_id,
        name: form.hospital_name,
        business_number: form.hospital_business_number,
      }
    : null;

  return (
    <Card as="section">
      <CardHeader className="pb-6">
        <CardTitle>병의원 정보</CardTitle>
        <CardDescription>소속 병의원과 의료진 기본 정보를 입력해 주세요.</CardDescription>
      </CardHeader>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="min-w-0">
          <MediaUploader
            title="프로필 사진"
            collections={DOCTOR_PROFILE_COLLECTIONS}
            filesByCollection={{
              profile_image: profileImage ? [profileImage] : [],
            }}
            existingItemsByCollection={
              existingProfileImage && !profileImage
                ? {
                    profile_image: [existingProfileImage],
                  }
                : undefined
            }
            errors={{
              profile_image: errors.profile_image,
            }}
            onChange={(_, files) => onProfileImageChange(files[0] ?? null)}
          />
        </div>

        <div className="min-w-0 space-y-6">
          <DoctorHospitalPicker
            mode={hospitalSelectionMode}
            selectedHospital={selectedHospital}
            error={errors.hospital_id}
            onSelectHospital={onSelectHospital}
          />

          <div className="space-y-2">
            <Label htmlFor="name">의료진명 *</Label>
            <InputField
              id="name"
              name="name"
              value={form.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
              placeholder="의료진명을 입력해 주세요."
              error={Boolean(errors.name)}
              hint={errors.name}
            />
          </div>

          <div className="space-y-4">
            <DoctorOptionButtonGroup
              id="gender"
              label="성별"
              required
              value={form.gender}
              options={DOCTOR_GENDER_OPTIONS}
              error={errors.gender}
              onChange={(value) => onFieldChange("gender", value)}
            />

            <DoctorOptionButtonGroup
              id="position"
              label="직책"
              required
              value={form.position}
              options={DOCTOR_POSITION_OPTIONS}
              columns={3}
              error={errors.position}
              onChange={(value) => onFieldChange("position", value)}
            />

            {showStatusFields ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">운영 상태 *</Label>
                  <Select
                    id="status"
                    name="status"
                    value={form.status}
                    options={[...DOCTOR_STATUS_OPTIONS]}
                    placeholder="운영 상태를 선택해 주세요."
                    onChange={(value: string) => onFieldChange("status", value)}
                    className="h-11 w-full px-4"
                  />
                  {errors.status ? <p className="text-xs text-error-500">{errors.status}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allow_status">검수 상태 *</Label>
                  <Select
                    id="allow_status"
                    name="allow_status"
                    value={form.allow_status}
                    options={[...DOCTOR_ALLOW_STATUS_OPTIONS]}
                    placeholder="검수 상태를 선택해 주세요."
                    onChange={(value: string) => onFieldChange("allow_status", value)}
                    className="h-11 w-full px-4"
                  />
                  {errors.allow_status ? <p className="text-xs text-error-500">{errors.allow_status}</p> : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

function DoctorHospitalPicker({
  mode,
  selectedHospital,
  error,
  onSelectHospital,
}: {
  mode: "search" | "readonly";
  selectedHospital: DoctorHospitalOption | null;
  error?: string;
  onSelectHospital: (hospital: DoctorHospitalOption) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const { options, isLoading, error: loadError } = useDoctorHospitalOptions(isOpen, query);

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
    <div className="space-y-2" data-field-target="hospital_id" tabIndex={-1}>
      <Label htmlFor="selected-hospital">소속 병의원 *</Label>

      <div ref={containerRef} className="relative space-y-2">
        {mode === "search" ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="min-w-0 flex-1">
              <InputField
                id="selected-hospital"
                value={selectedHospital?.name ?? ""}
                placeholder="병의원을 선택해 주세요."
                readOnly
                error={Boolean(error)}
                hint={error}
                className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
            <Button
              type="button"
              variant="brand"
              size="auth"
              onClick={() => setIsOpen((prev) => !prev)}
              className="w-full shrink-0 sm:w-auto"
            >
              <Search className="size-4" />
              <span>병의원 검색</span>
            </Button>
          </div>
        ) : (
          <InputField
            id="selected-hospital"
            value={selectedHospital?.name ?? ""}
            placeholder="소속 병의원 정보가 없습니다."
            readOnly
            error={Boolean(error)}
            hint={error}
            className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
        )}

        <InputField
          id="selected-hospital-business-number"
          value={selectedHospital?.business_number ?? ""}
          placeholder="선택한 병의원의 사업자번호가 표시됩니다."
          readOnly
          className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
        />

        {mode === "search" && isOpen ? (
          <Card className="absolute left-0 right-0 top-full z-20 mt-2 space-y-3 rounded-2xl p-4 shadow-lg">
            <InputField
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ID, 병의원명, 사업자번호 검색"
              className="bg-white dark:bg-gray-900"
            />

            {isLoading ? (
              <SpinnerBlock className="min-h-32" spinnerClassName="size-6" label="병의원 검색 중" />
            ) : loadError ? (
              <p className="text-sm text-error-500">{loadError}</p>
            ) : options.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">검색 결과가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                <div className="hidden grid-cols-[48px_minmax(0,2fr)_minmax(0,1fr)_auto] gap-2 rounded-xl bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-300 sm:grid">
                  <span>ID</span>
                  <span>병의원명</span>
                  <span>사업자등록번호</span>
                  <span className="sr-only">상태</span>
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto">
                {options.map((hospital) => {
                  const isSelected = selectedHospital?.id === hospital.id;

                  return (
                    <button
                      key={hospital.id}
                      type="button"
                      onClick={() => {
                        onSelectHospital(hospital);
                        setIsOpen(false);
                      }}
                      className={[
                        "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                        isSelected
                          ? "border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10"
                          : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800",
                      ].join(" ")}
                    >
                      <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-1 sm:grid-cols-[48px_minmax(0,2fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-2">
                        <span className="truncate text-sm font-medium text-gray-900 dark:text-white/90">{hospital.id}</span>
                        <span className="truncate text-sm font-medium text-gray-900 dark:text-white/90 sm:col-auto">{hospital.name}</span>
                        <span className="col-span-2 truncate text-xs text-gray-500 dark:text-gray-400 sm:col-auto sm:text-sm">
                          {hospital.business_number || "사업자번호 없음"}
                        </span>
                        {isSelected ? <span className="hidden shrink-0 text-xs font-semibold text-brand-500 sm:block">선택됨</span> : null}
                      </div>
                    </button>
                  );
                })}
                </div>
              </div>
            )}
          </Card>
        ) : null}
      </div>
    </div>
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
