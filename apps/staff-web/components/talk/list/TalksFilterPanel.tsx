import React from "react";

import {
  Button,
  Card,
  CheckboxFilterDropdown,
  DateRangeFilterDropdown,
  InputField,
} from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

import {
  DATE_PRESET_OPTIONS,
  TALK_CATEGORY_OPTIONS,
  TALK_STATUS_OPTIONS,
  type DatePresetKey,
  type Filters,
} from "@/lib/talk/list";

type TalksFilterPanelProps = {
  searchInput: string;
  draftFilters: Filters;
  draftDateRange?: DateRange;
  isStatusDropdownOpen: boolean;
  isCategoryDropdownOpen: boolean;
  isDatePickerOpen: boolean;
  statusDropdownRef: React.RefObject<HTMLDivElement | null>;
  categoryDropdownRef: React.RefObject<HTMLDivElement | null>;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onToggleStatusDropdown: () => void;
  onToggleCategoryDropdown: () => void;
  onToggleDatePicker: () => void;
  onToggleStatus: (value: string) => void;
  onToggleAllStatus: () => void;
  onToggleCategory: (value: string) => void;
  onToggleAllCategory: () => void;
  onApplyDateRange: (nextRange?: DateRange) => void;
  onApplyDatePreset: (preset: DatePresetKey) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function TalksFilterPanel({
  searchInput,
  draftFilters,
  draftDateRange,
  isStatusDropdownOpen,
  isCategoryDropdownOpen,
  isDatePickerOpen,
  statusDropdownRef,
  categoryDropdownRef,
  datePickerRef,
  onSearchChange,
  onToggleStatusDropdown,
  onToggleCategoryDropdown,
  onToggleDatePicker,
  onToggleStatus,
  onToggleAllStatus,
  onToggleCategory,
  onToggleAllCategory,
  onApplyDateRange,
  onApplyDatePreset,
  onApplyFilters,
  onResetFilters,
}: TalksFilterPanelProps) {
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 dark:text-gray-300";

  return (
    <Card className="rounded-xl p-3 dark:border-white/[0.05]">
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(15rem,1.2fr)]">
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>운영 상태</span>
          <CheckboxFilterDropdown
            label="운영 상태"
            hideLabel
            containerRef={statusDropdownRef}
            selectedValues={draftFilters.statuses}
            options={TALK_STATUS_OPTIONS}
            isOpen={isStatusDropdownOpen}
            onToggleOpen={onToggleStatusDropdown}
            onToggleValue={onToggleStatus}
            onToggleAll={onToggleAllStatus}
          />
        </div>
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>카테고리</span>
          <CheckboxFilterDropdown
            label="카테고리"
            hideLabel
            containerRef={categoryDropdownRef}
            selectedValues={draftFilters.categoryCodes}
            options={TALK_CATEGORY_OPTIONS}
            isOpen={isCategoryDropdownOpen}
            onToggleOpen={onToggleCategoryDropdown}
            onToggleValue={onToggleCategory}
            onToggleAll={onToggleAllCategory}
            emptyLabel="전체"
          />
        </div>
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>등록일</span>
          <DateRangeFilterDropdown
            label="등록일"
            hideLabel
            containerRef={datePickerRef}
            value={draftFilters.dateRange}
            placeholder="등록일 기간 선택"
            selected={draftDateRange}
            isOpen={isDatePickerOpen}
            presetOptions={DATE_PRESET_OPTIONS}
            onToggleOpen={onToggleDatePicker}
            onSelect={onApplyDateRange}
            onPresetSelect={(presetKey) => onApplyDatePreset(presetKey as DatePresetKey)}
            onReset={() => {
              onApplyDateRange(undefined);
              onToggleDatePicker();
            }}
            onConfirm={onToggleDatePicker}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-3 py-1.5 lg:col-span-2 lg:flex-row lg:items-center 2xl:col-span-full">
          <div className="flex min-w-0 flex-1 items-center gap-4">
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
                placeholder="제목, 내용 검색"
                className="bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="brand" onClick={onApplyFilters} size="sm" className="h-11 shrink-0 px-5">
              검색
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="h-11 border-brand-500 px-5 text-brand-500 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
            >
              필터 초기화
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
