import React from "react";

import {
  Button,
  Card,
  CheckboxFilterDropdown,
  ChevronDown,
  DateRangeFilterDropdown,
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
  isOpen: boolean;
  draftFilters: Filters;
  draftDateRange?: DateRange;
  isStatusDropdownOpen: boolean;
  isCategoryDropdownOpen: boolean;
  isDatePickerOpen: boolean;
  statusDropdownRef: React.RefObject<HTMLDivElement | null>;
  categoryDropdownRef: React.RefObject<HTMLDivElement | null>;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  onToggleFilters: () => void;
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
  isOpen,
  draftFilters,
  draftDateRange,
  isStatusDropdownOpen,
  isCategoryDropdownOpen,
  isDatePickerOpen,
  statusDropdownRef,
  categoryDropdownRef,
  datePickerRef,
  onToggleFilters,
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
  return (
    <Card className="rounded-xl p-0 dark:border-white/[0.05]">
      <Button
        type="button"
        variant="ghost"
        onClick={onToggleFilters}
        className="flex h-11 w-full items-center justify-between rounded-none px-3 text-left text-sm font-medium text-gray-700 dark:bg-transparent dark:text-white/90"
      >
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">필터</h3>
        <ChevronDown className={["size-4", isOpen ? "rotate-180" : "rotate-0"].join(" ")} />
      </Button>

      {isOpen ? (
        <div>
          <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
            <CheckboxFilterDropdown
              label="운영상태"
              containerRef={statusDropdownRef}
              selectedValues={draftFilters.statuses}
              options={TALK_STATUS_OPTIONS}
              isOpen={isStatusDropdownOpen}
              onToggleOpen={onToggleStatusDropdown}
              onToggleValue={onToggleStatus}
              onToggleAll={onToggleAllStatus}
            />

            <div>
              <CheckboxFilterDropdown
                label="카테고리"
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

            <DateRangeFilterDropdown
              label="등록일"
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

          <div className="flex items-center justify-end gap-2 px-3 pb-3">
            <Button type="button" variant="brand" onClick={onApplyFilters} size="sm" className="h-10 px-5">
              필터 적용
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-300"
            >
              필터 초기화
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
