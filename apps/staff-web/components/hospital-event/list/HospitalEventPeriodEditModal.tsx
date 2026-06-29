"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import {
  Button,
  DateRangeFilterDropdown,
  FormCheckbox,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
} from "@beaulab/ui-admin";

import { formatLocalDate, normalizeRangeDate, parseDateParam, type HospitalEventRow } from "@/lib/hospital-event/list";

export type HospitalEventPeriodEditState = {
  row: HospitalEventRow;
  eventStartAt: string;
  eventEndAt: string;
  isEventPeriodUnlimited: boolean;
  error: string | null;
};

const PERIOD_DATE_PRESET_OPTIONS = [
  { key: "oneMonth", label: "1개월" },
  { key: "twoMonths", label: "2개월" },
  { key: "threeMonths", label: "3개월" },
] as const;

export function HospitalEventPeriodEditModal({
  periodEdit,
  updating,
  onClose,
  onChange,
  onSubmit,
}: {
  periodEdit: HospitalEventPeriodEditState | null;
  updating: boolean;
  onClose: () => void;
  onChange: (patch: Partial<Omit<HospitalEventPeriodEditState, "row">>) => void;
  onSubmit: () => void;
}) {
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);

  const periodDateRange = getPeriodDateRange(periodEdit);
  const periodInputValue = periodEdit
    ? formatPeriodInputValue(periodEdit.eventStartAt, periodEdit.eventEndAt, periodEdit.isEventPeriodUnlimited)
    : "";

  React.useEffect(() => {
    if (!isDatePickerOpen) return;

    const onOutsideClick = (event: MouseEvent) => {
      if (!datePickerRef.current?.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [isDatePickerOpen]);

  const applyDateRange = React.useCallback(
    (nextRange?: DateRange, selectedDay?: Date) => {
      if (!nextRange?.from) {
        onChange({ eventStartAt: "", eventEndAt: "" });
        return;
      }

      const eventStartAt = formatLocalDate(
        normalizeRangeDate(periodEdit?.isEventPeriodUnlimited && selectedDay ? selectedDay : nextRange.from),
      );
      const eventEndAt = nextRange.to ? formatLocalDate(normalizeRangeDate(nextRange.to)) : "";

      onChange({
        eventStartAt,
        eventEndAt: periodEdit?.isEventPeriodUnlimited ? "" : eventEndAt,
      });
    },
    [onChange, periodEdit?.isEventPeriodUnlimited],
  );

  const applyPreset = React.useCallback(
    (presetKey: string) => {
      const baseDate = parseDateParam(periodEdit?.eventStartAt ?? "") ?? normalizeRangeDate(new Date());
      const presetMonths = presetKey === "threeMonths" ? 3 : presetKey === "twoMonths" ? 2 : 1;
      const endDate = addMonthsClamped(baseDate, presetMonths);

      onChange({
        eventStartAt: formatLocalDate(baseDate),
        eventEndAt: formatLocalDate(endDate),
        isEventPeriodUnlimited: false,
      });
    },
    [onChange, periodEdit?.eventStartAt],
  );

  return (
    <Modal isOpen={Boolean(periodEdit)} onClose={onClose} className="mx-4 w-full max-w-xl" showCloseButton={false}>
      <ModalPanel className="rounded-2xl p-6 shadow-none">
        <ModalHeader className="pr-0">
          <ModalTitle className="text-xl font-bold">이벤트 기간 수정</ModalTitle>
        </ModalHeader>

        <ModalBody className="mt-5 space-y-6">
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">
              이벤트 기간 <span className="text-error-500">*</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <DateRangeFilterDropdown
                label="이벤트 기간"
                hideLabel
                containerRef={datePickerRef}
                value={periodInputValue}
                placeholder="이벤트 기간을 선택해주세요"
                selected={periodDateRange}
                isOpen={isDatePickerOpen}
                presetOptions={PERIOD_DATE_PRESET_OPTIONS}
                onToggleOpen={() => setIsDatePickerOpen((prev) => !prev)}
                onSelect={applyDateRange}
                onPresetSelect={applyPreset}
                onReset={() => {
                  onChange({ eventStartAt: "", eventEndAt: "" });
                  setIsDatePickerOpen(false);
                }}
                onConfirm={() => setIsDatePickerOpen(false)}
                error={Boolean(periodEdit?.error)}
              />
              <div className="whitespace-nowrap">
                <FormCheckbox
                  checked={Boolean(periodEdit?.isEventPeriodUnlimited)}
                  onChange={(checked) =>
                    onChange({
                      isEventPeriodUnlimited: checked,
                      eventEndAt: checked ? "" : (periodEdit?.eventEndAt ?? ""),
                    })
                  }
                  label="종료일 없음"
                />
              </div>
            </div>
            {periodEdit?.error ? <p className="mt-2 text-sm font-medium text-error-500">{periodEdit.error}</p> : null}
          </div>
        </ModalBody>

        <ModalFooter className="mt-10 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full justify-center"
            disabled={updating}
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="brand"
            className="h-12 w-full justify-center"
            disabled={updating}
            onClick={() => void onSubmit()}
          >
            {updating ? "수정 중" : "수정하기"}
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}

function formatPeriodInputValue(startAt: string, endAt: string, isUnlimited: boolean) {
  if (!startAt) return "";

  if (isUnlimited) {
    return `${formatShortHyphenDate(startAt)} ~ 무기한`;
  }

  return endAt ? `${formatShortHyphenDate(startAt)} ~ ${formatShortHyphenDate(endAt)}` : formatShortHyphenDate(startAt);
}

function getPeriodDateRange(periodEdit: HospitalEventPeriodEditState | null): DateRange | undefined {
  if (!periodEdit?.eventStartAt) return undefined;
  const startDate = parseDateParam(periodEdit.eventStartAt);
  if (!startDate) return undefined;

  return {
    from: startDate,
    to: periodEdit.isEventPeriodUnlimited ? startDate : parseDateParam(periodEdit.eventEndAt),
  };
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
