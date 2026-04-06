import React from "react";
import {
  Button,
  Card,
  CheckboxFilterDropdown,
  DateRangeFilterDropdown,
  InputField,
  SquarePlus,
} from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

import {
  DATE_PRESET_OPTIONS,
  HASHTAG_STATUS_OPTIONS,
  type DateFilterKey,
  type DatePresetKey,
  type Filters,
} from "@/lib/hashtag/list";

type HashtagsFilterPanelProps = {
  searchInput: string;
  draftFilters: Filters;
  draftDateRange?: DateRange;
  draftUpdatedDateRange?: DateRange;
  isStatusDropdownOpen: boolean;
  isDatePickerOpen: boolean;
  isUpdatedDatePickerOpen: boolean;
  statusDropdownRef: React.RefObject<HTMLDivElement | null>;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  updatedDatePickerRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onOpenCreate: () => void;
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
  searchInput,
  draftFilters,
  draftDateRange,
  draftUpdatedDateRange,
  isStatusDropdownOpen,
  isDatePickerOpen,
  isUpdatedDatePickerOpen,
  statusDropdownRef,
  datePickerRef,
  updatedDatePickerRef,
  onSearchChange,
  onOpenCreate,
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
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 dark:text-gray-300";

  return (
    <Card className="rounded-xl p-3 dark:border-white/[0.05]">
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(15rem,1.2fr)_minmax(15rem,1.2fr)]">
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>운영 상태</span>
          <CheckboxFilterDropdown
            label="운영 상태"
            hideLabel
            containerRef={statusDropdownRef}
            selectedValues={draftFilters.statuses}
            options={HASHTAG_STATUS_OPTIONS}
            isOpen={isStatusDropdownOpen}
            onToggleOpen={onToggleStatusDropdown}
            onToggleValue={onToggleStatus}
            onToggleAll={onToggleAllStatus}
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
            onSelect={(nextRange) => onApplyDateRange("created", nextRange)}
            onPresetSelect={(presetKey) => onApplyDatePreset("created", presetKey as DatePresetKey)}
            onReset={() => {
              onApplyDateRange("created", undefined);
              onToggleDatePicker();
            }}
            onConfirm={onToggleDatePicker}
          />
        </div>
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>수정일</span>
          <DateRangeFilterDropdown
            label="수정일"
            hideLabel
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
                placeholder="해시태그명 검색"
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
            <Button type="button" variant="brand" size="sm" className="h-11 px-5" onClick={onOpenCreate}>
              <SquarePlus className="size-5" />
              <span>해시태그 등록</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
