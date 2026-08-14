"use client";

import React from "react";
import { ArrowLeft, Button, Card, ChevronDown, FormCheckbox, InputField, Label, SpinnerBlock } from "@beaulab/ui-admin";

import { useObjectUrl } from "@/hooks/common/useObjectUrl";
import { useDoctorHospitalOptions } from "@/hooks/doctor/useDoctorHospitalOptions";
import type { DoctorHospitalOption } from "@/lib/doctor/form";
import { resolveHospitalEventMediaUrl } from "@/lib/hospital-event/list";
import { getEventAdMediaFilename, resolveEventAdMediaUrl, type EventAdMediaAsset } from "@/lib/hospital-event-ad/list";
import {
  EVENT_AD_CREATE_FORM_ID,
  formatEventAdPeriodLabel,
  type EventAdAvailabilityWeek,
  type EventAdCategoryOption,
  type EventAdCreateFormErrors,
  type EventAdCreateFormValues,
  type EventAdHospitalEventOption,
  type EventAdPlacementOption,
} from "@/lib/hospital-event-ad/form";

export function EventAdFormStep({
  form,
  errors,
  selectedPlacement,
  selectedCategory,
  selectedWeek,
  eventOptions,
  isLoadingEvents,
  eventLoadError,
  adImageFile,
  existingAdImage = null,
  isFreeAd,
  isHospitalEditable = true,
  onSubmit,
  onBack,
  onSetField,
  onSelectHospital,
  onClearHospital,
  onSetAdImageFile,
  onAdImageError,
  onFreeAdChange,
}: {
  form: EventAdCreateFormValues;
  errors: EventAdCreateFormErrors;
  selectedPlacement: EventAdPlacementOption;
  selectedCategory: EventAdCategoryOption | null;
  selectedWeek: EventAdAvailabilityWeek;
  eventOptions: EventAdHospitalEventOption[];
  isLoadingEvents: boolean;
  eventLoadError: string | null;
  adImageFile: File | null;
  existingAdImage?: EventAdMediaAsset | null;
  isFreeAd: boolean;
  isHospitalEditable?: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  onSetField: <K extends keyof EventAdCreateFormValues>(key: K, value: EventAdCreateFormValues[K]) => void;
  onSelectHospital: (hospital: DoctorHospitalOption) => void;
  onClearHospital: () => void;
  onSetAdImageFile: (file: File | null) => void;
  onAdImageError: (message: string) => void;
  onFreeAdChange: (checked: boolean) => void;
}) {
  return (
    <form id={EVENT_AD_CREATE_FORM_ID} onSubmit={onSubmit} autoComplete="off" className="space-y-4">
      <Card className="relative rounded-xl p-6">
        <div className="absolute top-6 right-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 transition hover:border-brand-300 hover:text-brand-500"
          >
            <ArrowLeft className="size-4" />
            <span>뒤로가기</span>
          </button>
        </div>

        <div className="grid gap-8 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="min-w-0">
            <AdTemporaryPreviewCard adImageFile={adImageFile} existingAdImage={existingAdImage} />
          </div>

          <div className="max-w-[34rem] min-w-0 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">상품정보</h2>
            <InfoRow label="광고위치" value={selectedPlacement.label} />
            {selectedCategory ? (
              <InfoRow label="카테고리" value={selectedCategory.display_name || selectedCategory.name} />
            ) : null}
            <InfoRow label="광고기간" value={formatEventAdPeriodLabel(selectedWeek)} />
            <FormRow label="금액">
              <div className="flex h-11 items-center gap-4">
                <span className="text-sm font-semibold text-gray-800">
                  {isFreeAd ? "0P" : formatEventAdCost(selectedPlacement.cost)}
                </span>
                <FormCheckbox checked={isFreeAd} onChange={onFreeAdChange} label="무료이벤트" />
              </div>
            </FormRow>

            {isHospitalEditable ? (
              <HospitalSearchRow
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
            ) : (
              <InfoRow label="병의원" value={form.hospital_name || "-"} />
            )}

            <EventSearchRow
              selectedEvent={eventOptions.find((event) => event.id === form.hospital_event_id) ?? null}
              eventOptions={eventOptions}
              disabled={!form.hospital_id || isLoadingEvents}
              isLoading={isLoadingEvents}
              error={errors.hospital_event_id || eventLoadError || undefined}
              placeholder={
                !form.hospital_id
                  ? "병의원을 먼저 선택해 주세요."
                  : isLoadingEvents
                    ? "이벤트 불러오는 중"
                    : "이벤트를 선택해 주세요."
              }
              onSelectEvent={(event) => onSetField("hospital_event_id", event.id)}
            />

            <AdImageFileRow
              file={adImageFile}
              existingAdImage={existingAdImage}
              error={errors.ad_image_file}
              onChange={onSetAdImageFile}
              onValidationError={onAdImageError}
            />
          </div>
        </div>
      </Card>
    </form>
  );
}

const EVENT_AD_IMAGE_ACCEPT = "image/jpeg,image/png";
const EVENT_AD_IMAGE_MAX_SIZE = 10 * 1024 * 1024;
const eventAdInputClassName = "h-11 bg-white px-4 text-sm";
const eventAdLabelClassName = "pt-2 text-xs font-semibold text-gray-500";

function AdTemporaryPreviewCard({
  adImageFile,
  existingAdImage,
}: {
  adImageFile: File | null;
  existingAdImage: EventAdMediaAsset | null;
}) {
  const objectUrl = useObjectUrl(adImageFile);
  const imageUrl = objectUrl ?? resolveEventAdMediaUrl(existingAdImage, "original");

  return (
    <div className="min-w-0">
      <h2 className="text-sm font-bold text-gray-900">미리보기</h2>
      <div className="mt-4 w-full rounded-[1.75rem] border border-gray-200 bg-white p-2 shadow-sm">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-400" />
          <span className="h-2 w-10 rounded-full bg-gray-200" />
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img src={imageUrl} alt="광고 이미지 미리보기" className="aspect-[4/3] w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center px-6 text-center text-xs font-semibold text-gray-400">
              광고 이미지 미리보기
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdImageFileRow({
  file,
  existingAdImage,
  error,
  onChange,
  onValidationError,
}: {
  file: File | null;
  existingAdImage: EventAdMediaAsset | null;
  error?: string;
  onChange: (file: File | null) => void;
  onValidationError: (message: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const fileName = file?.name ?? getEventAdMediaFilename(existingAdImage);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    event.currentTarget.value = "";

    if (!selectedFile) return;

    if (!EVENT_AD_IMAGE_ACCEPT.split(",").includes(selectedFile.type)) {
      onValidationError("광고 이미지는 jpg, jpeg, png 파일만 업로드할 수 있습니다.");
      return;
    }

    if (selectedFile.size > EVENT_AD_IMAGE_MAX_SIZE) {
      onValidationError("광고 이미지는 최대 10MB 이하로 업로드해 주세요.");
      return;
    }

    onChange(selectedFile);
  };

  return (
    <FormRow label="광고이미지" required error={error}>
      <div className="space-y-2">
        <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
          <span
            className={[
              "min-w-0 truncate rounded-md px-2 py-1 text-xs",
              fileName ? "bg-gray-50 font-medium text-gray-700" : "text-gray-500",
            ].join(" ")}
          >
            {fileName || "jpg, jpeg, png / 최대 10MB"}
          </span>
          <Button
            type="button"
            variant="brand"
            size="sm"
            className="h-8 shrink-0 px-3 text-xs"
            onClick={() => inputRef.current?.click()}
          >
            파일선택
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={EVENT_AD_IMAGE_ACCEPT}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </FormRow>
  );
}

function EventSearchRow({
  selectedEvent,
  eventOptions,
  disabled,
  isLoading,
  error,
  placeholder,
  onSelectEvent,
}: {
  selectedEvent: EventAdHospitalEventOption | null;
  eventOptions: EventAdHospitalEventOption[];
  disabled: boolean;
  isLoading: boolean;
  error?: string;
  placeholder: string;
  onSelectEvent: (event: EventAdHospitalEventOption) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <FormRow label="이벤트" required error={error}>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          className={[
            "flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-4 text-left text-sm transition",
            disabled
              ? "cursor-not-allowed bg-gray-50 text-gray-400"
              : "text-gray-800 hover:border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none",
          ].join(" ")}
          onClick={() => {
            if (!disabled) setIsOpen(true);
          }}
        >
          <span className={["min-w-0 truncate", selectedEvent ? "text-gray-800" : "text-gray-400"].join(" ")}>
            {selectedEvent?.name ?? placeholder}
          </span>
          <ChevronDown className="size-4 shrink-0 text-gray-400" />
        </button>

        {isOpen && !disabled ? (
          <Card className="absolute top-full right-0 left-0 z-[80] mt-2 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
            {isLoading ? (
              <div className="py-5">
                <SpinnerBlock className="min-h-0" spinnerClassName="size-5" label="이벤트 불러오는 중" />
              </div>
            ) : eventOptions.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-500">선택 가능한 이벤트가 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {eventOptions.slice(0, 10).map((event) => (
                  <EventOptionButton
                    key={event.id}
                    event={event}
                    isSelected={selectedEvent?.id === event.id}
                    onClick={() => {
                      onSelectEvent(event);
                      setIsOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </Card>
        ) : null}
      </div>
    </FormRow>
  );
}

function EventOptionButton({
  event,
  isSelected,
  onClick,
}: {
  event: EventAdHospitalEventOption;
  isSelected: boolean;
  onClick: () => void;
}) {
  const thumbnailUrl = resolveHospitalEventMediaUrl(event.thumbnail_image, "thumb");

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full min-w-0 gap-3 rounded-lg p-2 text-left transition hover:bg-brand-50",
        isSelected ? "bg-brand-50" : "",
      ].join(" ")}
    >
      <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-[10px] font-semibold text-gray-400">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- thumbnail URL from API
          <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          "NO IMG"
        )}
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block truncate text-sm font-semibold text-gray-800">{event.name}</span>
        <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
          <span>{formatEventAdCost(Number(event.event_price ?? 0))}</span>
          <span>{formatEventOptionDate(event.created_at)}</span>
        </span>
      </span>
    </button>
  );
}

function HospitalSearchRow({
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

  React.useEffect(() => {
    setQuery(selectedHospital?.name ?? "");
  }, [selectedHospital?.id, selectedHospital?.name]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <FormRow label="병의원" required error={error}>
      <div ref={containerRef} className="relative">
        <InputField
          value={query}
          placeholder="병의원명을 검색해 주세요."
          onClick={() => setIsOpen(true)}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            if (selectedHospital && nextQuery !== selectedHospital.name) {
              onClearHospital();
            }
            setIsOpen(true);
          }}
          className={eventAdInputClassName}
        />
        {isOpen ? (
          <Card className="absolute top-full right-0 left-0 z-[80] mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
            {isLoading ? (
              <div className="py-5">
                <SpinnerBlock className="min-h-0" spinnerClassName="size-5" label="병의원 검색 중" />
              </div>
            ) : loadError ? (
              <p className="px-3 py-4 text-sm text-error-500">{loadError}</p>
            ) : options.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-500">검색 결과가 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {options.slice(0, 5).map((hospital) => (
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
                      HID {hospital.id} · 사업자등록번호 {hospital.business_number?.trim() || "-"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>
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
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-3">
      <Label className={eventAdLabelClassName}>
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 text-sm">
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      <span className="min-w-0 break-words text-gray-800">{value || "-"}</span>
    </div>
  );
}

function formatEventAdCost(cost: number) {
  return `${Number(cost || 0).toLocaleString()}P`;
}

function formatEventOptionDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10) || "-";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
