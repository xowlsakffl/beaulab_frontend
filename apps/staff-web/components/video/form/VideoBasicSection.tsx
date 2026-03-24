import React from "react";

import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  InputField,
  Label,
  Search,
  Select,
  SpinnerBlock,
  FormTextArea,
} from "@beaulab/ui-admin";

import { useVideoDoctorOptions } from "@/hooks/video/useVideoDoctorOptions";
import { useVideoHospitalOptions } from "@/hooks/video/useVideoHospitalOptions";
import {
  VIDEO_ALLOW_STATUS_OPTIONS,
  VIDEO_STATUS_OPTIONS,
  type VideoDoctorOption,
  type VideoFormErrors,
  type VideoFormValues,
  type VideoHospitalOption,
} from "@/lib/video/form";

type VideoBasicSectionProps = {
  form: VideoFormValues;
  errors: VideoFormErrors;
  onFieldChange: (key: keyof VideoFormValues, value: VideoFormValues[keyof VideoFormValues]) => void;
  onSelectHospital: (hospital: VideoHospitalOption) => void;
  onSelectDoctorOption: (doctor: VideoDoctorOption | null) => void;
};

export function VideoBasicSection({
  form,
  errors,
  onFieldChange,
  onSelectHospital,
  onSelectDoctorOption,
}: VideoBasicSectionProps) {
  const doctorOptionsResult = useVideoDoctorOptions(form.hospital_id);
  const selectedHospital = form.hospital_id
    ? {
        id: form.hospital_id,
        name: form.hospital_name,
        business_number: form.hospital_business_number,
      }
    : null;

  const selectedDoctorOption = React.useMemo(() => {
    if (!form.doctor_id) return null;

    const matchedOption = doctorOptionsResult.options.find((item) => item.id === form.doctor_id);
    if (matchedOption) return matchedOption;

    return {
      id: form.doctor_id,
      name: form.doctor_name || `의료진 #${form.doctor_id}`,
      position: null,
    } satisfies VideoDoctorOption;
  }, [doctorOptionsResult.options, form.doctor_id, form.doctor_name]);

  const doctorSelectOptions = React.useMemo(() => {
    const baseOptions = doctorOptionsResult.options.map((item) => ({
      value: String(item.id),
      label: item.position ? `${item.name} (${item.position})` : item.name,
    }));

    if (selectedDoctorOption && !doctorOptionsResult.options.some((item) => item.id === selectedDoctorOption.id)) {
      return [
        {
          value: String(selectedDoctorOption.id),
          label: selectedDoctorOption.position
            ? `${selectedDoctorOption.name} (${selectedDoctorOption.position})`
            : selectedDoctorOption.name,
        },
        ...baseOptions,
      ];
    }

    return baseOptions;
  }, [doctorOptionsResult.options, selectedDoctorOption]);

  return (
    <Card as="section">
      <CardHeader className="pb-6">
        <CardTitle>동영상 정보</CardTitle>
        <CardDescription>소속 병의원과 동영상 기본 정보를 입력해 주세요.</CardDescription>
      </CardHeader>

      <div className="space-y-6">
        <VideoHospitalPicker
          selectedHospital={selectedHospital}
          error={errors.hospital_id}
          onSelectHospital={onSelectHospital}
        />

        <div className="space-y-2">
          <Label htmlFor="doctor_id">의료진</Label>
          <Select
            id="doctor_id"
            name="doctor_id"
            value={form.doctor_id ? String(form.doctor_id) : ""}
            options={doctorSelectOptions}
            placeholder={
              !form.hospital_id
                ? "먼저 병의원을 선택해 주세요."
                : doctorOptionsResult.isLoading
                  ? "의료진 불러오는 중"
                  : "의료진을 선택해 주세요."
            }
            disabled={!form.hospital_id || doctorOptionsResult.isLoading}
            onChange={(value: string) => {
              if (!value) {
                onSelectDoctorOption(null);
                return;
              }

              const matched = doctorOptionsResult.options.find((item) => String(item.id) === value)
                ?? selectedDoctorOption
                ?? null;

              onSelectDoctorOption(matched && String(matched.id) === value ? matched : null);
            }}
            className="h-11 w-full px-4"
          />
          {doctorOptionsResult.error ? <p className="text-xs text-error-500">{doctorOptionsResult.error}</p> : null}
          {errors.doctor_id ? <p className="text-xs text-error-500">{errors.doctor_id}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">제목 *</Label>
          <InputField
            id="title"
            name="title"
            value={form.title}
            onChange={(event) => onFieldChange("title", event.target.value)}
            placeholder="동영상 제목을 입력해 주세요."
            error={Boolean(errors.title)}
            hint={errors.title}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">설명</Label>
          <FormTextArea
            id="description"
            name="description"
            rows={5}
            value={form.description}
            onChange={(value) => onFieldChange("description", value)}
            placeholder="동영상 설명을 입력해 주세요."
            error={Boolean(errors.description)}
            hint={errors.description}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="status">운영 상태 *</Label>
            <Select
              id="status"
              name="status"
              value={form.status}
              options={[...VIDEO_STATUS_OPTIONS]}
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
              options={[...VIDEO_ALLOW_STATUS_OPTIONS]}
              placeholder="검수 상태를 선택해 주세요."
              onChange={(value: string) => onFieldChange("allow_status", value)}
              className="h-11 w-full px-4"
            />
            {errors.allow_status ? <p className="text-xs text-error-500">{errors.allow_status}</p> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

function VideoHospitalPicker({
  selectedHospital,
  error,
  onSelectHospital,
}: {
  selectedHospital: VideoHospitalOption | null;
  error?: string;
  onSelectHospital: (hospital: VideoHospitalOption) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const { options, isLoading, error: loadError } = useVideoHospitalOptions(isOpen, query);

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
      <Label htmlFor="selected-video-hospital">병의원 *</Label>

      <div ref={containerRef} className="relative space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="min-w-0 flex-1">
            <InputField
              id="selected-video-hospital"
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

        <InputField
          id="selected-video-hospital-business-number"
          value={selectedHospital?.business_number ?? ""}
          placeholder="선택한 병의원의 사업자등록번호가 표시됩니다."
          readOnly
          className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
        />

        {isOpen ? (
          <Card className="absolute left-0 right-0 top-full z-20 mt-2 space-y-3 rounded-2xl p-4 shadow-lg">
            <InputField
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ID, 병의원명, 사업자등록번호 검색"
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
                          <span className="truncate text-sm font-medium text-gray-900 dark:text-white/90">{hospital.name}</span>
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
