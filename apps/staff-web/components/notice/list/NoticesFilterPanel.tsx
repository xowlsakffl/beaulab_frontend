import React from "react";

import { Button, Card, CheckboxFilterDropdown, ChevronDown, DateRangeFilterDropdown, type CheckboxFilterOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

import type { DateFilterKey, DatePresetKey } from "@/lib/notice/list";

type NoticesFilterPanelProps = {
  isOpen: boolean;
  draftStatuses: string[];
  draftChannels: string[];
  draftDateLabel: string;
  draftUpdatedDateLabel: string;
  draftDateRange?: DateRange;
  draftUpdatedDateRange?: DateRange;
  isStatusDropdownOpen: boolean;
  isChannelDropdownOpen: boolean;
  isDatePickerOpen: boolean;
  isUpdatedDatePickerOpen: boolean;
  statusDropdownRef: React.RefObject<HTMLDivElement | null>;
  channelDropdownRef: React.RefObject<HTMLDivElement | null>;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  updatedDatePickerRef: React.RefObject<HTMLDivElement | null>;
  statusOptions: CheckboxFilterOption[];
  channelOptions: CheckboxFilterOption[];
  datePresetOptions: readonly { key: string; label: string }[];
  onToggleFilters: () => void;
  onToggleStatusDropdown: () => void;
  onToggleChannelDropdown: () => void;
  onToggleDatePicker: () => void;
  onToggleUpdatedDatePicker: () => void;
  onToggleStatus: (value: string) => void;
  onToggleChannel: (value: string) => void;
  onToggleAllStatuses: () => void;
  onToggleAllChannels: () => void;
  onApplyDateRange: (key: DateFilterKey, nextRange?: DateRange) => void;
  onApplyDatePreset: (key: DateFilterKey, preset: DatePresetKey) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function NoticesFilterPanel({
  isOpen,
  draftStatuses,
  draftChannels,
  draftDateLabel,
  draftUpdatedDateLabel,
  draftDateRange,
  draftUpdatedDateRange,
  isStatusDropdownOpen,
  isChannelDropdownOpen,
  isDatePickerOpen,
  isUpdatedDatePickerOpen,
  statusDropdownRef,
  channelDropdownRef,
  datePickerRef,
  updatedDatePickerRef,
  statusOptions,
  channelOptions,
  datePresetOptions,
  onToggleFilters,
  onToggleStatusDropdown,
  onToggleChannelDropdown,
  onToggleDatePicker,
  onToggleUpdatedDatePicker,
  onToggleStatus,
  onToggleChannel,
  onToggleAllStatuses,
  onToggleAllChannels,
  onApplyDateRange,
  onApplyDatePreset,
  onApplyFilters,
  onResetFilters,
}: NoticesFilterPanelProps) {
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
          <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4">
            <CheckboxFilterDropdown
              label="운영 상태"
              containerRef={statusDropdownRef}
              selectedValues={draftStatuses}
              options={statusOptions}
              isOpen={isStatusDropdownOpen}
              onToggleOpen={onToggleStatusDropdown}
              onToggleValue={onToggleStatus}
              onToggleAll={onToggleAllStatuses}
            />
            <CheckboxFilterDropdown
              label="채널"
              containerRef={channelDropdownRef}
              selectedValues={draftChannels}
              options={channelOptions}
              isOpen={isChannelDropdownOpen}
              onToggleOpen={onToggleChannelDropdown}
              onToggleValue={onToggleChannel}
              onToggleAll={onToggleAllChannels}
              allLabel="전체 선택"
              selectedText={(count) => `${count}개 선택`}
            />
            <DateRangeFilterDropdown
              label="등록일"
              containerRef={datePickerRef}
              value={draftDateLabel}
              placeholder="등록일 기간 선택"
              selected={draftDateRange}
              isOpen={isDatePickerOpen}
              presetOptions={datePresetOptions}
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
              value={draftUpdatedDateLabel}
              placeholder="수정일 기간 선택"
              selected={draftUpdatedDateRange}
              isOpen={isUpdatedDatePickerOpen}
              presetOptions={datePresetOptions}
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
