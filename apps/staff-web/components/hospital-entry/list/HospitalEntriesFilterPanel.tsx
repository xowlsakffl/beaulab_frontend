"use client";

import React from "react";
import type { DateRange } from "react-day-picker";

import { Button, Card, CheckboxFilterDropdown, DateRangeFilterDropdown, InputField } from "@beaulab/ui-admin";

import {
  DATE_PRESET_OPTIONS,
  HOSPITAL_ENTRY_ALLOW_STATUS_OPTIONS,
  type DateFilterKey,
  type DatePresetKey,
  type Filters,
} from "@/lib/hospital-entry/list";

type HospitalEntriesFilterPanelProps = {
  draftFilters: Filters;
  draftDateRange?: DateRange;
  isAllowStatusDropdownOpen: boolean;
  isDatePickerOpen: boolean;
  allowStatusDropdownRef: React.RefObject<HTMLDivElement | null>;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onToggleAllowStatusDropdown: () => void;
  onToggleDatePicker: () => void;
  onToggleAllowStatus: (value: string) => void;
  onToggleAllAllowStatus: () => void;
  onApplyDateRange: (key: DateFilterKey, nextRange?: DateRange) => void;
  onApplyDatePreset: (key: DateFilterKey, preset: DatePresetKey) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function HospitalEntriesFilterPanel({
  draftFilters,
  draftDateRange,
  isAllowStatusDropdownOpen,
  isDatePickerOpen,
  allowStatusDropdownRef,
  datePickerRef,
  searchInput,
  onSearchChange,
  onToggleAllowStatusDropdown,
  onToggleDatePicker,
  onToggleAllowStatus,
  onToggleAllAllowStatus,
  onApplyDateRange,
  onApplyDatePreset,
  onApplyFilters,
  onResetFilters,
}: HospitalEntriesFilterPanelProps) {
  const inlineLabelClass = "w-[72px] shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600";
  const filterRowClass = "flex min-w-0 items-center gap-3";

  return (
    <Card className="min-w-0 rounded-xl p-3">
      <div className="space-y-3">
        <div className="grid min-w-0 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
          <div className={filterRowClass}>
            <span className={inlineLabelClass}>기간</span>
            <DateRangeFilterDropdown
              label="기간"
              hideLabel
              containerRef={datePickerRef}
              value={draftFilters.dateRange}
              placeholder="신청일 기간 선택"
              selected={draftDateRange}
              isOpen={isDatePickerOpen}
              presetOptions={DATE_PRESET_OPTIONS}
              onToggleOpen={onToggleDatePicker}
              onSelect={(nextRange) => onApplyDateRange("created", nextRange)}
              onPresetSelect={(presetKey) => onApplyDatePreset("created", presetKey as DatePresetKey)}
              onReset={() => {
                onApplyDateRange("created", undefined);
                onToggleDatePicker();
              }}
              onConfirm={onToggleDatePicker}
            />
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>검수상태</span>
            <CheckboxFilterDropdown
              label="검수상태"
              hideLabel
              containerRef={allowStatusDropdownRef}
              selectedValues={draftFilters.allowStatuses}
              options={HOSPITAL_ENTRY_ALLOW_STATUS_OPTIONS}
              isOpen={isAllowStatusDropdownOpen}
              onToggleOpen={onToggleAllowStatusDropdown}
              onToggleValue={onToggleAllowStatus}
              onToggleAll={onToggleAllAllowStatus}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-3 py-1.5 md:col-span-2 xl:col-span-2 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className={inlineLabelClass}>검색</span>
              <div className="min-w-0 flex-1">
                <InputField
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onApplyFilters();
                    }
                  }}
                  placeholder="ID, 병의원명, 대표자, 신청자 검색"
                  className="bg-white"
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
