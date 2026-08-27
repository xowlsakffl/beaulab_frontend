"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import { Button, Card, DateRangeFilterDropdown, InputField, SingleCheckboxFilterDropdown } from "@beaulab/ui-admin";

import {
  HOSPITAL_EVENT_REAL_MODEL_DB_DATE_PRESET_OPTIONS,
  HOSPITAL_EVENT_REAL_MODEL_DB_GENDER_OPTIONS,
  HOSPITAL_EVENT_REAL_MODEL_DB_STATUS_OPTIONS,
  type HospitalEventRealModelDBDatePresetKey,
  type HospitalEventRealModelDBFilters,
} from "@/lib/hospital-event-real-model-db/list";

type HospitalEventRealModelDBsFilterPanelProps = {
  searchInput: string;
  draftFilters: HospitalEventRealModelDBFilters;
  draftDateRange?: DateRange;
  isDatePickerOpen: boolean;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onToggleDatePicker: () => void;
  onApplyDateRange: (nextRange?: DateRange) => void;
  onApplyDatePreset: (preset: HospitalEventRealModelDBDatePresetKey) => void;
  onBirthYearMinChange: (value: string) => void;
  onBirthYearMaxChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function HospitalEventRealModelDBsFilterPanel({
  searchInput,
  draftFilters,
  draftDateRange,
  isDatePickerOpen,
  datePickerRef,
  onSearchChange,
  onToggleDatePicker,
  onApplyDateRange,
  onApplyDatePreset,
  onBirthYearMinChange,
  onBirthYearMaxChange,
  onGenderChange,
  onStatusChange,
  onApplyFilters,
  onResetFilters,
}: HospitalEventRealModelDBsFilterPanelProps) {
  const filterRowClass = "flex min-w-0 items-center gap-3";
  const inlineLabelClass = "w-[72px] shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600";
  const isBirthYearRangeInvalid =
    draftFilters.birthYearMin !== "" &&
    draftFilters.birthYearMax !== "" &&
    Number(draftFilters.birthYearMax) < Number(draftFilters.birthYearMin);

  const handleEnterToSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    if (isBirthYearRangeInvalid) return;
    onApplyFilters();
  };

  return (
    <Card className="min-w-0 rounded-xl p-3">
      <div className="space-y-3">
        <div className="grid min-w-0 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-6">
          <div className={`${filterRowClass} xl:col-span-2`}>
            <span className={inlineLabelClass}>신청일</span>
            <div className="min-w-0 flex-1">
              <DateRangeFilterDropdown
                label="신청일"
                hideLabel
                containerRef={datePickerRef}
                value={draftFilters.dateRange}
                placeholder="신청일 기간 선택"
                selected={draftDateRange}
                isOpen={isDatePickerOpen}
                presetOptions={HOSPITAL_EVENT_REAL_MODEL_DB_DATE_PRESET_OPTIONS}
                onToggleOpen={onToggleDatePicker}
                onSelect={onApplyDateRange}
                onPresetSelect={(presetKey) => onApplyDatePreset(presetKey as HospitalEventRealModelDBDatePresetKey)}
                onReset={() => {
                  onApplyDateRange(undefined);
                  onToggleDatePicker();
                }}
                onConfirm={onToggleDatePicker}
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>성별</span>
            <div className="min-w-0 flex-1">
              <SingleCheckboxFilterDropdown
                label="성별"
                hideLabel
                value={draftFilters.gender}
                options={HOSPITAL_EVENT_REAL_MODEL_DB_GENDER_OPTIONS}
                onChange={onGenderChange}
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>승인상태</span>
            <div className="min-w-0 flex-1">
              <SingleCheckboxFilterDropdown
                label="승인상태"
                hideLabel
                value={draftFilters.status}
                options={HOSPITAL_EVENT_REAL_MODEL_DB_STATUS_OPTIONS}
                onChange={onStatusChange}
              />
            </div>
          </div>

          <div className={`${filterRowClass} md:col-span-2 xl:col-span-2`}>
            <span className={inlineLabelClass}>출생연도</span>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <InputField
                value={draftFilters.birthYearMin}
                onChange={(event) => onBirthYearMinChange(event.target.value.replace(/\D/g, "").slice(0, 4))}
                onKeyDown={handleEnterToSearch}
                placeholder="1990"
                className="w-full bg-white"
                error={isBirthYearRangeInvalid}
              />
              <span className="shrink-0 text-sm text-gray-400">~</span>
              <InputField
                value={draftFilters.birthYearMax}
                onChange={(event) => onBirthYearMaxChange(event.target.value.replace(/\D/g, "").slice(0, 4))}
                onKeyDown={handleEnterToSearch}
                placeholder="2000"
                className="w-full bg-white"
                error={isBirthYearRangeInvalid}
              />
            </div>
          </div>

          <div className="col-span-full flex min-w-0 flex-col gap-3 py-1.5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className={inlineLabelClass}>검색</span>
              <div className="min-w-0 flex-1">
                <InputField
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={handleEnterToSearch}
                  placeholder="RDID, 병의원, 이벤트, 이름을 입력해주세요"
                  className="w-full bg-white"
                />
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="brand"
                size="filter"
                onClick={onApplyFilters}
                className="shrink-0"
                disabled={isBirthYearRangeInvalid}
              >
                검색
              </Button>
              <Button type="button" variant="brandOutline" size="filter" onClick={onResetFilters} className="shrink-0">
                검색 초기화
              </Button>
            </div>
          </div>
          {isBirthYearRangeInvalid ? (
            <p className="col-span-full text-right text-xs text-error-500">
              출생연도 최대값은 최소값 이상이어야 합니다.
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
