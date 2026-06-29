"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import {
  Button,
  Card,
  DateRangeFilterDropdown,
  FormCheckbox,
  FormTextArea,
  InputField,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  SegmentedTabs,
} from "@beaulab/ui-admin";

import { HospitalEventInlineImageFileField } from "@/components/hospital-event/form/HospitalEventMediaFields";
import {
  DoctorVisibilitySection,
  EventOptionsSection,
  TextItemSection,
} from "@/components/hospital-event/form/HospitalEventFormSubsections";
import {
  HOSPITAL_EVENT_PROCEDURE_BENEFIT_MAX_COUNT,
  HOSPITAL_EVENT_PROCEDURE_TARGET_MAX_COUNT,
  calculateHospitalEventDBBasePrice,
  formatNumberInput,
  parseNumberInput,
  type HospitalEventFieldName,
  type HospitalEventFormErrors,
  type HospitalEventFormValues,
  type HospitalEventOptionForm,
  type HospitalEventType,
} from "@/lib/hospital-event/form";
import {
  formatLocalDate,
  normalizeRangeDate,
  parseDateParam,
  type HospitalEventMedia,
} from "@/lib/hospital-event/list";

const EVENT_PERIOD_PRESET_OPTIONS = [
  { key: "oneMonth", label: "1개월" },
  { key: "twoMonths", label: "2개월" },
  { key: "threeMonths", label: "3개월" },
] as const;
const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const labelClassName = "text-xs font-semibold text-gray-500";
const inputClassName = "h-9 bg-white px-3 text-sm";

export function EventInfoCard({
  form,
  errors,
  isTreatmentEvent,
  discountRate,
  eventPriceError,
  thumbnailImage,
  eventPageImage,
  existingThumbnailImage,
  existingEventPageImage,
  onThumbnailChange,
  onEventPageChange,
  onUploadWarning,
  onFieldChange,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onAddTextItem,
  onRemoveTextItem,
  onTextItemChange,
}: {
  form: HospitalEventFormValues;
  errors: HospitalEventFormErrors;
  isTreatmentEvent: boolean;
  discountRate: number;
  eventPriceError: string | null;
  thumbnailImage: File | null;
  eventPageImage: File | null;
  existingThumbnailImage: HospitalEventMedia | null;
  existingEventPageImage: HospitalEventMedia | null;
  onThumbnailChange: (file: File | null) => void;
  onEventPageChange: (file: File | null) => void;
  onUploadWarning: (message: string) => void;
  onFieldChange: <K extends keyof HospitalEventFormValues>(key: K, value: HospitalEventFormValues[K]) => void;
  onOptionChange: (index: number, patch: Partial<HospitalEventOptionForm>) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onAddTextItem: (key: "procedure_targets" | "procedure_benefits") => void;
  onRemoveTextItem: (key: "procedure_targets" | "procedure_benefits", index: number) => void;
  onTextItemChange: (key: "procedure_targets" | "procedure_benefits", index: number, value: string) => void;
}) {
  const eventDatePickerRef = React.useRef<HTMLDivElement | null>(null);
  const [isEventDatePickerOpen, setIsEventDatePickerOpen] = React.useState(false);
  const [consultationPriceResetValue, setConsultationPriceResetValue] = React.useState<number | null>(null);
  const eventPriceValue = parseNumberInput(form.event_price);
  const baseConsultationPrice = calculateHospitalEventDBBasePrice(eventPriceValue);
  const eventDateRange = React.useMemo<DateRange | undefined>(() => {
    if (!form.event_start_at) return undefined;

    const startDate = parseDateParam(form.event_start_at);
    if (!startDate) return undefined;

    return {
      from: startDate,
      to: form.is_event_period_unlimited ? startDate : parseDateParam(form.event_end_at),
    };
  }, [form.event_end_at, form.event_start_at, form.is_event_period_unlimited]);
  const eventPeriodInputValue = React.useMemo(
    () => formatEventPeriodInputValue(form.event_start_at, form.event_end_at, form.is_event_period_unlimited),
    [form.event_end_at, form.event_start_at, form.is_event_period_unlimited],
  );

  const applyEventDateRange = React.useCallback(
    (nextRange?: DateRange, selectedDay?: Date) => {
      if (!nextRange?.from) {
        onFieldChange("event_start_at", "");
        onFieldChange("event_end_at", "");
        return;
      }

      const eventStartAt = formatLocalDate(
        normalizeRangeDate(form.is_event_period_unlimited && selectedDay ? selectedDay : nextRange.from),
      );
      const eventEndAt = nextRange.to ? formatLocalDate(normalizeRangeDate(nextRange.to)) : "";

      onFieldChange("event_start_at", eventStartAt);
      onFieldChange("event_end_at", form.is_event_period_unlimited ? "" : eventEndAt);
    },
    [form.is_event_period_unlimited, onFieldChange],
  );

  const applyEventPeriodPreset = React.useCallback(
    (presetKey: string) => {
      const baseDate = parseDateParam(form.event_start_at) ?? normalizeRangeDate(new Date());
      const presetMonths = presetKey === "threeMonths" ? 3 : presetKey === "twoMonths" ? 2 : 1;
      const endDate = addMonthsClamped(baseDate, presetMonths);

      onFieldChange("event_start_at", formatLocalDate(baseDate));
      onFieldChange("event_end_at", formatLocalDate(endDate));
      onFieldChange("is_event_period_unlimited", false);
    },
    [form.event_start_at, onFieldChange],
  );

  const handleConsultationPriceBlur = React.useCallback(() => {
    const consultationPrice = parseNumberInput(form.consultation_price);
    if (eventPriceValue <= 0 || consultationPrice <= 0 || consultationPrice >= baseConsultationPrice) return;

    setConsultationPriceResetValue(baseConsultationPrice);
  }, [baseConsultationPrice, eventPriceValue, form.consultation_price]);

  const confirmConsultationPriceReset = React.useCallback(() => {
    if (consultationPriceResetValue === null) return;

    onFieldChange("consultation_price", formatNumberInput(String(consultationPriceResetValue)));
    setConsultationPriceResetValue(null);
  }, [consultationPriceResetValue, onFieldChange]);

  return (
    <>
      <Card className={cardClassName}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-bold text-gray-900">이벤트 정보</h3>
          <SegmentedTabs
            items={[
              { value: "IMAGE", label: "이미지 등록" },
              { value: "TEXT", label: "텍스트 등록" },
            ]}
            value={form.event_type}
            onValueChange={(value) => {
              onFieldChange("event_type", value as HospitalEventType);
            }}
            className="w-44 rounded-lg p-0.5"
            tabClassName="whitespace-nowrap rounded-md px-3 py-1.5 text-xs"
          />
        </div>

        <div className="space-y-4">
          <InlineField label="이벤트명" required error={errors.name} target="name">
            <InputField
              value={form.name}
              onChange={(event) => onFieldChange("name", event.target.value.slice(0, 20))}
              placeholder="20자 이내로 이벤트명을 입력해 주세요."
              error={Boolean(errors.name)}
              className={inputClassName}
            />
          </InlineField>

          <InlineField label="이벤트설명" required error={errors.description} target="description">
            <InputField
              value={form.description}
              onChange={(event) => onFieldChange("description", event.target.value.slice(0, 40))}
              placeholder="40자 이내로 이벤트 설명을 입력해 주세요."
              error={Boolean(errors.description)}
              className={inputClassName}
            />
          </InlineField>

          <InlineField
            label="기간선택"
            required
            error={errors.event_start_at ?? errors.event_end_at}
            target={errors.event_start_at ? "event_start_at" : "event_end_at"}
          >
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <DateRangeFilterDropdown
                label="이벤트 기간"
                hideLabel
                containerRef={eventDatePickerRef}
                value={eventPeriodInputValue}
                placeholder="이벤트 기간을 선택해 주세요."
                selected={eventDateRange}
                isOpen={isEventDatePickerOpen}
                presetOptions={EVENT_PERIOD_PRESET_OPTIONS}
                onToggleOpen={() => setIsEventDatePickerOpen((prev) => !prev)}
                onSelect={applyEventDateRange}
                onPresetSelect={applyEventPeriodPreset}
                onReset={() => {
                  onFieldChange("event_start_at", "");
                  onFieldChange("event_end_at", "");
                  setIsEventDatePickerOpen(false);
                }}
                onConfirm={() => setIsEventDatePickerOpen(false)}
                error={Boolean(errors.event_start_at ?? errors.event_end_at)}
                triggerClassName={inputClassName}
              />
              <FormCheckbox
                checked={form.is_event_period_unlimited}
                onChange={(checked) => {
                  onFieldChange("is_event_period_unlimited", checked);
                  if (checked) {
                    onFieldChange("event_end_at", "");
                  }
                }}
                label="종료일 없음"
              />
            </div>
          </InlineField>

          <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
            <div className="space-y-3">
              <div className="grid h-6 grid-cols-[7rem_minmax(0,1fr)] items-center gap-3">
                <FormCheckbox
                  checked={form.is_vat_included}
                  onChange={(checked) => onFieldChange("is_vat_included", checked)}
                  label="VAT 포함"
                  className="size-4 rounded-full"
                />
                <span className="text-xs leading-5 whitespace-nowrap text-gray-500">
                  부가가치세는 할인 금액에 반드시 포함해 주세요.
                </span>
              </div>
              <div className="grid h-6 grid-cols-[7rem_minmax(0,1fr)] items-center gap-3">
                <FormCheckbox
                  checked={!form.is_vat_included}
                  onChange={(checked) => onFieldChange("is_vat_included", !checked)}
                  label="VAT 비대상"
                  className="size-4 rounded-full"
                />
                <span className="text-xs leading-5 whitespace-nowrap text-gray-500">
                  실비·건강보험은 진료(치료)에 해당하는 경우에만 적용 가능합니다.
                </span>
              </div>
            </div>
            <div className="my-4 h-px bg-gray-200" />
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                * 실비보험·건강보험 등 치료 목적이 아닌 경우에는 일괄 VAT 포함을 선택해 주세요.
              </p>
              <InlineField label="정상 가격" required error={errors.normal_price} target="normal_price">
                <PriceInput
                  value={form.normal_price}
                  onChange={(value) => onFieldChange("normal_price", value)}
                  error={Boolean(errors.normal_price)}
                />
              </InlineField>
              <InlineField
                label="이벤트 가격"
                required
                error={errors.event_price ?? eventPriceError ?? undefined}
                target="event_price"
                footer={<p className="text-xs text-gray-500">* 49% 이상 할인은 적용이 불가합니다.</p>}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_4.75rem] gap-2">
                  <PriceInput
                    value={form.event_price}
                    onChange={(value) => onFieldChange("event_price", value)}
                    error={Boolean(errors.event_price || eventPriceError)}
                  />
                  <div className="flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-brand-500">
                    할인율 {discountRate}%
                  </div>
                </div>
              </InlineField>
              <InlineField label="상담신청단가" error={errors.consultation_price} target="consultation_price">
                <div className="space-y-1">
                  <PriceInput
                    value={form.consultation_price}
                    onChange={(value) => onFieldChange("consultation_price", value)}
                    onBlur={handleConsultationPriceBlur}
                    error={Boolean(errors.consultation_price)}
                    unit="P (POINT)"
                  />
                  <p className="text-xs text-gray-500">
                    * 기준 단가보다 높게 책정하여 이벤트 진행 가능하지만, 해당 건의 환불이 불가능합니다.
                  </p>
                </div>
              </InlineField>
            </div>
          </div>

          {isTreatmentEvent ? (
            <EventOptionsSection
              enabled={form.has_options}
              options={form.options}
              error={errors.options}
              onEnabledChange={(checked) => onFieldChange("has_options", checked)}
              onOptionChange={onOptionChange}
              onAddOption={onAddOption}
              onRemoveOption={onRemoveOption}
            />
          ) : null}

          {form.event_type === "TEXT" ? (
            <>
              <TextItemSection
                title="시술 대상"
                items={form.procedure_targets}
                maxItems={HOSPITAL_EVENT_PROCEDURE_TARGET_MAX_COUNT}
                error={errors.procedure_targets}
                onAdd={() => onAddTextItem("procedure_targets")}
                onRemove={(index) => onRemoveTextItem("procedure_targets", index)}
                onChange={(index, value) => onTextItemChange("procedure_targets", index, value)}
              />
              <TextItemSection
                title="시술 장점"
                items={form.procedure_benefits}
                maxItems={HOSPITAL_EVENT_PROCEDURE_BENEFIT_MAX_COUNT}
                error={errors.procedure_benefits}
                onAdd={() => onAddTextItem("procedure_benefits")}
                onRemove={(index) => onRemoveTextItem("procedure_benefits", index)}
                onChange={(index, value) => onTextItemChange("procedure_benefits", index, value)}
              />
              <DoctorVisibilitySection
                assignments={form.doctor_assignments}
                onChange={(index, patch) => {
                  const nextAssignments = [...form.doctor_assignments];
                  nextAssignments[index] = { ...nextAssignments[index], ...patch };
                  onFieldChange("doctor_assignments", nextAssignments);
                }}
              />
            </>
          ) : null}

          <InlineField label="부작용안내" error={errors.side_effect_notice} target="side_effect_notice">
            <FormTextArea
              value={form.side_effect_notice}
              onChange={(value) => onFieldChange("side_effect_notice", value.slice(0, 90))}
              rows={3}
              placeholder="예) 수술/시술 후 염증, 출혈, 감염 등 부작용이 발생할 수 있어 주의가 필요합니다."
              error={Boolean(errors.side_effect_notice)}
            />
          </InlineField>

          <HospitalEventInlineImageFileField
            label="썸네일"
            target="thumbnail_image"
            required
            helper="800px x 800px 이상, 1:1비율, 2MB 이하"
            file={thumbnailImage}
            existingMedia={existingThumbnailImage}
            error={errors.thumbnail_image}
            onChange={onThumbnailChange}
            onUploadWarning={onUploadWarning}
          />
          {form.event_type === "IMAGE" ? (
            <HospitalEventInlineImageFileField
              label="이벤트 페이지"
              target="event_page_image"
              required
              helper="가로 800px 이상, 5MB 이하"
              file={eventPageImage}
              existingMedia={existingEventPageImage}
              error={errors.event_page_image}
              onChange={onEventPageChange}
              onUploadWarning={onUploadWarning}
            />
          ) : null}
        </div>
      </Card>
      <Modal
        isOpen={consultationPriceResetValue !== null}
        onClose={confirmConsultationPriceReset}
        showCloseButton={false}
        className="mx-4 w-full max-w-md"
      >
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle>상담신청단가 확인</ModalTitle>
          </ModalHeader>
          <ModalBody className="mt-5">
            <p className="text-sm leading-6 font-medium text-gray-800">
              기준 단가보다 낮게 설정할 수 없어요. 최소 기준 단가로 되돌릴게요.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="brand" onClick={confirmConsultationPriceReset}>
              확인
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>
    </>
  );
}

function InlineField({
  label,
  required = false,
  error,
  target,
  footer,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  target?: HospitalEventFieldName;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-3"
      data-field-target={target}
      tabIndex={target ? -1 : undefined}
    >
      <Label className={`${labelClassName} pt-2`}>
        {label}
        {required ? <span className="ml-0.5 text-brand-500">*</span> : null}
      </Label>
      <div className="min-w-0">
        {children}
        {error ? <p className="mt-1.5 text-xs text-error-500">{error}</p> : null}
        {footer ? <div className="mt-1.5">{footer}</div> : null}
      </div>
    </div>
  );
}

function PriceInput({
  value,
  onChange,
  onBlur,
  error,
  unit = "원",
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
  unit?: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_4rem] items-center gap-2">
      <InputField
        value={value}
        onChange={(event) => onChange(formatNumberInput(event.target.value))}
        onBlur={onBlur}
        placeholder="숫자만 입력해 주세요."
        error={error}
        className={inputClassName}
      />
      <span className="text-xs font-semibold text-gray-600">{unit}</span>
    </div>
  );
}

function formatEventPeriodInputValue(startAt: string, endAt: string, isUnlimited: boolean) {
  if (!startAt) return "";

  if (isUnlimited) {
    return `${formatShortHyphenDate(startAt)} ~ 무기한`;
  }

  return endAt ? `${formatShortHyphenDate(startAt)} ~ ${formatShortHyphenDate(endAt)}` : formatShortHyphenDate(startAt);
}

function formatShortHyphenDate(value: string) {
  return value.length === 10 ? value.slice(2) : value;
}

function addMonthsClamped(date: Date, months: number) {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const day = date.getDate();
  const lastDayOfTargetMonth = new Date(year, month + 1, 0).getDate();

  return normalizeRangeDate(new Date(year, month, Math.min(day, lastDayOfTargetMonth)));
}
