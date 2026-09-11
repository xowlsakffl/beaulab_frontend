"use client";

import React from "react";
import { Card, DateRangeFilterDropdown, InputField, Select, Spinner, StatusValueBadge } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";
import { formatLocalDate, parseDateParam } from "@/lib/common/date-range-filter";
import type { PromotionFieldName, PromotionFormErrors, PromotionFormValues } from "@/lib/hospital-promotion/form";
import {
  labelPromotionProgress,
  labelPromotionStatus,
  promotionProgressColor,
  promotionStatusColor,
  PROMOTION_POSITION_OPTIONS,
  promotionPositionOption,
  PROMOTION_STATUS_OPTIONS,
} from "@/lib/hospital-promotion/options";
import type { PromotionAvailability, PromotionProgress } from "@/lib/hospital-promotion/types";
import { PromotionFormField } from "./PromotionFormField";
import { PromotionScheduleConflicts } from "./PromotionScheduleConflicts";

export function PromotionSettingsSection({
  form,
  errors,
  disabled,
  isEditing,
  minStartDate,
  canStatus,
  scheduleLocked,
  progress,
  periodWarning,
  scheduleConflict,
  checkingAvailability,
  periodOpen,
  onPeriodOpenChange,
  onPeriodChange,
  onFieldChange,
  onBlur,
}: {
  form: PromotionFormValues;
  errors: PromotionFormErrors;
  disabled: boolean;
  isEditing: boolean;
  minStartDate?: string;
  canStatus: boolean;
  scheduleLocked: boolean;
  progress: PromotionProgress | null;
  periodWarning: string | null;
  scheduleConflict: PromotionAvailability | null;
  checkingAvailability: boolean;
  periodOpen: boolean;
  onPeriodOpenChange: (open: boolean) => void;
  onPeriodChange: (period: Pick<PromotionFormValues, "start_date" | "end_date">) => void;
  onFieldChange: <K extends keyof PromotionFormValues>(field: K, value: PromotionFormValues[K]) => void;
  onBlur: (field: PromotionFieldName) => void;
}) {
  const [periodDraft, setPeriodDraft] = React.useState<DateRange | undefined>(undefined);
  const periodRef = React.useRef<HTMLDivElement | null>(null);
  const commitPeriod = React.useCallback(() => {
    onPeriodChange({
      start_date: periodDraft?.from ? formatLocalDate(periodDraft.from) : "",
      end_date: periodDraft?.to ? formatLocalDate(periodDraft.to) : "",
    });
    onPeriodOpenChange(false);
  }, [onPeriodChange, onPeriodOpenChange, periodDraft]);
  React.useEffect(() => {
    if (!periodOpen) return;
    const close = (event: MouseEvent) => {
      if (!periodRef.current?.contains(event.target as Node)) commitPeriod();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") commitPeriod();
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [commitPeriod, periodOpen]);

  const periodError = errors.start_date || errors.end_date;
  const selectedPeriod = periodOpen
    ? periodDraft
    : { from: parseDateParam(form.start_date), to: parseDateParam(form.end_date) };
  const periodLabel = selectedPeriod?.from
    ? `${formatLocalDate(selectedPeriod.from)} ~ ${selectedPeriod.to ? formatLocalDate(selectedPeriod.to) : ""}`
    : "";
  return (
    <Card as="section" className="min-w-0 space-y-5 rounded-xl p-5">
      <h2 className="border-b border-gray-200 pb-3 text-sm font-bold text-gray-900">기본정보</h2>
      <PromotionFormField label="프로모션명" htmlFor="promotion-title" required error={errors.title}>
        <InputField
          id="promotion-title"
          name="title"
          value={form.title}
          maxLength={255}
          disabled={disabled}
          onChange={(event) => onFieldChange("title", event.target.value)}
          onBlur={() => onBlur("title")}
          placeholder="프로모션명을 입력해 주세요."
          error={Boolean(errors.title)}
          aria-required="true"
          aria-invalid={Boolean(errors.title)}
        />
      </PromotionFormField>
      <fieldset disabled={disabled || scheduleLocked} className="min-w-0 space-y-5 disabled:opacity-60">
        <PromotionFormField label="게시위치" htmlFor="promotion-position" required error={errors.side || errors.slot}>
          <Select
            id="promotion-position"
            name="position"
            value={promotionPositionOption(form.side, form.slot)?.value ?? ""}
            options={PROMOTION_POSITION_OPTIONS}
            disabled={disabled || scheduleLocked}
            onChange={(value) => {
              const position = PROMOTION_POSITION_OPTIONS.find((option) => option.value === value);
              if (!position) return;
              onFieldChange("side", position.side);
              onFieldChange("slot", position.slot);
            }}
            placeholder="게시위치를 선택해 주세요."
            aria-required="true"
            aria-invalid={Boolean(errors.side || errors.slot)}
          />
        </PromotionFormField>
        <PromotionFormField label="게시기간" required error={periodError}>
          <div
            id="promotion-period"
            ref={periodRef}
            role="group"
            aria-label="게시기간"
            aria-busy={checkingAvailability}
            className="relative"
          >
            <DateRangeFilterDropdown
              label="게시기간"
              hideLabel
              value={periodLabel}
              placeholder="시작일 ~ 종료일"
              selected={selectedPeriod}
              minDate={parseDateParam(minStartDate)}
              isOpen={periodOpen && !disabled && !scheduleLocked}
              onToggleOpen={() => {
                if (periodOpen) {
                  commitPeriod();
                  return;
                }
                setPeriodDraft({ from: parseDateParam(form.start_date), to: parseDateParam(form.end_date) });
                onPeriodOpenChange(true);
              }}
              onSelect={setPeriodDraft}
              onReset={() => setPeriodDraft(undefined)}
              onConfirm={commitPeriod}
              presetOptions={[]}
              onPresetSelect={() => {}}
              error={Boolean(periodError || scheduleConflict)}
              triggerClassName={checkingAvailability ? "[&>span]:pr-6" : undefined}
            />
            {checkingAvailability ? (
              <span className="pointer-events-none absolute inset-y-0 right-10 flex items-center">
                <Spinner className="size-3.5" />
              </span>
            ) : null}
          </div>
          {scheduleConflict ? <PromotionScheduleConflicts availability={scheduleConflict} /> : null}
        </PromotionFormField>
      </fieldset>
      {periodWarning ? (
        <p role="alert" className="text-xs text-error-500">
          {periodWarning}
        </p>
      ) : null}
      {isEditing ? (
        <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-3">
          <span className="text-xs font-semibold text-gray-600">진행상태</span>
          <div className="flex h-11 items-center" aria-live="polite">
            {progress ? (
              <StatusValueBadge label={labelPromotionProgress(progress)} color={promotionProgressColor(progress)} />
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </div>
        </div>
      ) : null}
      <PromotionFormField
        label="공개여부"
        htmlFor={canStatus ? "promotion-status" : undefined}
        required={canStatus}
        error={errors.status}
      >
        {canStatus ? (
          <Select
            id="promotion-status"
            name="status"
            value={form.status}
            options={PROMOTION_STATUS_OPTIONS}
            showPlaceholderOption={false}
            disabled={disabled}
            onChange={(value) => onFieldChange("status", value)}
          />
        ) : (
          <div className="flex h-11 items-center">
            <StatusValueBadge label={labelPromotionStatus(form.status)} color={promotionStatusColor(form.status)} />
          </div>
        )}
      </PromotionFormField>
    </Card>
  );
}
