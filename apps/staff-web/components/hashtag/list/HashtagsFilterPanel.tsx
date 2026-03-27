import React from "react";
import { Button, Card, CheckboxFilterDropdown, ChevronDown, DateRangeFilterDropdown } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

import {
  DATE_PRESET_OPTIONS,
  HASHTAG_STATUS_OPTIONS,
  type DateFilterKey,
  type DatePresetKey,
  type Filters,
} from "@/lib/hashtag/list";

type HashtagsFilterPanelProps = {
  isOpen: boolean;
  draftFilters: Filters;
  draftDateRange?: DateRange;
  draftUpdatedDateRange?: DateRange;
  isStatusDropdownOpen: boolean;
  isDatePickerOpen: boolean;
  isUpdatedDatePickerOpen: boolean;
  statusDropdownRef: React.RefObject<HTMLDivElement | null>;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  updatedDatePickerRef: React.RefObject<HTMLDivElement | null>;
  onToggleFilters: () => void;
  onToggleStatusDropdown: () => void;
  onToggleDatePicker: () => void;
  onToggleUpdatedDatePicker: () => void;
  onToggleStatus: (value: string) => void;
  onToggleAllStatus: () => void;
  onApplyDateRange: (key: DateFilterKey, nextRange?: DateRange) => void;
  onApplyDatePreset: (key: DateFilterKey, preset: DatePresetKey) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function HashtagsFilterPanel({
  isOpen,
  draftFilters,
  draftDateRange,
  draftUpdatedDateRange,
  isStatusDropdownOpen,
  isDatePickerOpen,
  isUpdatedDatePickerOpen,
  statusDropdownRef,
  datePickerRef,
  updatedDatePickerRef,
  onToggleFilters,
  onToggleStatusDropdown,
  onToggleDatePicker,
  onToggleUpdatedDatePicker,
  onToggleStatus,
  onToggleAllStatus,
  onApplyDateRange,
  onApplyDatePreset,
  onApplyFilters,
  onResetFilters,
}: HashtagsFilterPanelProps) {
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
              label="운영 상태"
              containerRef={statusDropdownRef}
              selectedValues={draftFilters.statuses}
              options={HASHTAG_STATUS_OPTIONS}
              isOpen={isStatusDropdownOpen}
              onToggleOpen={onToggleStatusDropdown}
              onToggleValue={onToggleStatus}
              onToggleAll={onToggleAllStatus}
            />
            <DateRangeFilterDropdown
              label="등록일"
              containerRef={datePickerRef}
              value={draftFilters.dateRange}
              placeholder="등록일 기간 선택"
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
            <DateRangeFilterDropdown
              label="수정일"
              containerRef={updatedDatePickerRef}
              value={draftFilters.updatedDateRange}
              placeholder="수정일 기간 선택"
              selected={draftUpdatedDateRange}
              isOpen={isUpdatedDatePickerOpen}
              presetOptions={DATE_PRESET_OPTIONS}
              onToggleOpen={onToggleUpdatedDatePicker}
              onSelect={(nextRange) => onApplyDateRange("updated", nextRange)}
              onPresetSelect={(presetKey) => onApplyDatePreset("updated", presetKey as DatePresetKey)}
              onReset={() => {
                onApplyDateRange("updated", undefined);
                onToggleUpdatedDatePicker();
              }}
              onConfirm={onToggleUpdatedDatePicker}
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
