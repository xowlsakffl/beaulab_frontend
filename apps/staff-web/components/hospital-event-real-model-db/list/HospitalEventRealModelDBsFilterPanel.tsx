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
  isDatePickerOpen: boolean;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onToggleDatePicker: () => void;
  onApplyDateRange: (nextRange?: DateRange) => void;
  onApplyDatePreset: (preset: HospitalEventRealModelDBDatePresetKey) => void;
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
        <div className="grid min-w-0 grid-cols-[minmax(0,1.6fr)_minmax(0,0.7fr)_minmax(0,0.85fr)_minmax(0,3fr)] gap-x-3 gap-y-3 max-[1800px]:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,0.9fr)]">
          <div className={filterRowClass}>
            <span className={inlineLabelClass}>기간</span>
            <div className="min-w-0 flex-1">
              <DateRangeFilterDropdown
                label="기간"
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

          <div className="flex min-w-0 flex-row items-center gap-2 py-1.5 max-[1800px]:col-span-full">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className={inlineLabelClass}>검색</span>
              <div className="min-w-0 flex-1">
                <InputField
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={handleEnterToSearch}
                  placeholder="RMID, 병의원, 이벤트, 이름, 전화번호, 지원부위를 입력해주세요"
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
