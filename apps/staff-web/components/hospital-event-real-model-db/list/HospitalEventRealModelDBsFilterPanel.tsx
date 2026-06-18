"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import {
  Button,
  Card,
  DateRangeFilterDropdown,
  InputField,
  SingleCheckboxFilterDropdown,
} from "@beaulab/ui-admin";

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
  draftBirthDateRange?: DateRange;
  isDatePickerOpen: boolean;
  isBirthDatePickerOpen: boolean;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  birthDatePickerRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onToggleDatePicker: () => void;
  onToggleBirthDatePicker: () => void;
  onApplyDateRange: (nextRange?: DateRange) => void;
  onApplyBirthDateRange: (nextRange?: DateRange) => void;
  onApplyDatePreset: (preset: HospitalEventRealModelDBDatePresetKey) => void;
  onApplyBirthDatePreset: (preset: HospitalEventRealModelDBDatePresetKey) => void;
  onGenderChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function HospitalEventRealModelDBsFilterPanel({
  searchInput,
  draftFilters,
  draftDateRange,
  draftBirthDateRange,
  isDatePickerOpen,
  isBirthDatePickerOpen,
  datePickerRef,
  birthDatePickerRef,
  onSearchChange,
  onToggleDatePicker,
  onToggleBirthDatePicker,
  onApplyDateRange,
  onApplyBirthDateRange,
  onApplyDatePreset,
  onApplyBirthDatePreset,
  onGenderChange,
  onStatusChange,
  onApplyFilters,
  onResetFilters,
}: HospitalEventRealModelDBsFilterPanelProps) {
  const filterRowClass = "flex min-w-0 items-center gap-2 py-1.5";
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 ";

  const handleEnterToSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    onApplyFilters();
  };

  return (
    <Card className="min-w-0 rounded-xl p-3 ">
      <div className="space-y-3">
        <div className="grid min-w-0 grid-cols-[minmax(0,1.45fr)_minmax(0,0.65fr)_minmax(0,0.8fr)_minmax(0,1.45fr)] gap-x-3 gap-y-3">
          <div className={filterRowClass}>
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
            <span className={inlineLabelClass}>승인여부</span>
            <div className="min-w-0 flex-1">
              <SingleCheckboxFilterDropdown
                label="승인여부"
                hideLabel
                value={draftFilters.status}
                options={HOSPITAL_EVENT_REAL_MODEL_DB_STATUS_OPTIONS}
                onChange={onStatusChange}
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>생년월일</span>
            <div className="min-w-0 flex-1">
              <DateRangeFilterDropdown
                label="생년월일"
                hideLabel
                containerRef={birthDatePickerRef}
                value={draftFilters.birthDateRange}
                placeholder="생년월일 기간 선택"
                selected={draftBirthDateRange}
                isOpen={isBirthDatePickerOpen}
                presetOptions={HOSPITAL_EVENT_REAL_MODEL_DB_DATE_PRESET_OPTIONS}
                onToggleOpen={onToggleBirthDatePicker}
                onSelect={onApplyBirthDateRange}
                onPresetSelect={(presetKey) => onApplyBirthDatePreset(presetKey as HospitalEventRealModelDBDatePresetKey)}
                onReset={() => {
                  onApplyBirthDateRange(undefined);
                  onToggleBirthDatePicker();
                }}
                onConfirm={onToggleBirthDatePicker}
              />
            </div>
          </div>

          <div className="col-span-full flex min-w-0 flex-row items-center gap-2 py-1.5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className={inlineLabelClass}>검색</span>
              <div className="min-w-0 flex-1">
                <InputField
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={handleEnterToSearch}
                  placeholder="RDID, 병의원, 이벤트, 이름을 입력해주세요"
                  className="w-full bg-white "
                />
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <Button type="button" variant="brand" size="filter" onClick={onApplyFilters} className="shrink-0">
                검색
              </Button>
              <Button type="button" variant="brandOutline" size="filter" onClick={onResetFilters} className="shrink-0">
                검색 초기화
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
