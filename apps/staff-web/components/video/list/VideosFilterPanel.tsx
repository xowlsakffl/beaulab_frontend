import React from "react";

import { Button, Card, CheckboxFilterDropdown, ChevronDown, DateRangeFilterDropdown, type CheckboxFilterOption } from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

import type { DateFilterKey, DatePresetKey, Filters } from "@/lib/video/list";

type VideosFilterPanelProps = {
  isOpen: boolean;
  draftFilters: Filters;
  draftDateRange?: DateRange;
  draftAllowedDateRange?: DateRange;
  isOperatingStatusDropdownOpen: boolean;
  isApprovalStatusDropdownOpen: boolean;
  isDistributionChannelDropdownOpen: boolean;
  isDatePickerOpen: boolean;
  isAllowedDatePickerOpen: boolean;
  operatingStatusDropdownRef: React.RefObject<HTMLDivElement | null>;
  approvalStatusDropdownRef: React.RefObject<HTMLDivElement | null>;
  distributionChannelDropdownRef: React.RefObject<HTMLDivElement | null>;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  allowedDatePickerRef: React.RefObject<HTMLDivElement | null>;
  operatingStatusOptions: CheckboxFilterOption[];
  approvalStatusOptions: CheckboxFilterOption[];
  distributionChannelOptions: CheckboxFilterOption[];
  datePresetOptions: readonly { key: string; label: string }[];
  onToggleFilters: () => void;
  onToggleOperatingStatusDropdown: () => void;
  onToggleApprovalStatusDropdown: () => void;
  onToggleDistributionChannelDropdown: () => void;
  onToggleDatePicker: () => void;
  onToggleAllowedDatePicker: () => void;
  onToggleOperatingStatus: (value: string) => void;
  onToggleApprovalStatus: (value: string) => void;
  onToggleDistributionChannel: (value: string) => void;
  onToggleAllOperatingStatus: () => void;
  onToggleAllApprovalStatus: () => void;
  onToggleAllDistributionChannel: () => void;
  onApplyDateRange: (key: DateFilterKey, nextRange?: DateRange) => void;
  onApplyDatePreset: (key: DateFilterKey, preset: DatePresetKey) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function VideosFilterPanel({
  isOpen,
  draftFilters,
  draftDateRange,
  draftAllowedDateRange,
  isOperatingStatusDropdownOpen,
  isApprovalStatusDropdownOpen,
  isDistributionChannelDropdownOpen,
  isDatePickerOpen,
  isAllowedDatePickerOpen,
  operatingStatusDropdownRef,
  approvalStatusDropdownRef,
  distributionChannelDropdownRef,
  datePickerRef,
  allowedDatePickerRef,
  operatingStatusOptions,
  approvalStatusOptions,
  distributionChannelOptions,
  datePresetOptions,
  onToggleFilters,
  onToggleOperatingStatusDropdown,
  onToggleApprovalStatusDropdown,
  onToggleDistributionChannelDropdown,
  onToggleDatePicker,
  onToggleAllowedDatePicker,
  onToggleOperatingStatus,
  onToggleApprovalStatus,
  onToggleDistributionChannel,
  onToggleAllOperatingStatus,
  onToggleAllApprovalStatus,
  onToggleAllDistributionChannel,
  onApplyDateRange,
  onApplyDatePreset,
  onApplyFilters,
  onResetFilters,
}: VideosFilterPanelProps) {
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
          <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-5">
            <CheckboxFilterDropdown
              label="운영 상태"
              containerRef={operatingStatusDropdownRef}
              selectedValues={draftFilters.operatingStatuses}
              options={operatingStatusOptions}
              isOpen={isOperatingStatusDropdownOpen}
              onToggleOpen={onToggleOperatingStatusDropdown}
              onToggleValue={onToggleOperatingStatus}
              onToggleAll={onToggleAllOperatingStatus}
            />
            <CheckboxFilterDropdown
              label="검수 상태"
              containerRef={approvalStatusDropdownRef}
              selectedValues={draftFilters.approvalStatuses}
              options={approvalStatusOptions}
              isOpen={isApprovalStatusDropdownOpen}
              onToggleOpen={onToggleApprovalStatusDropdown}
              onToggleValue={onToggleApprovalStatus}
              onToggleAll={onToggleAllApprovalStatus}
            />
            <CheckboxFilterDropdown
              label="배포채널"
              containerRef={distributionChannelDropdownRef}
              selectedValues={draftFilters.distributionChannels}
              options={distributionChannelOptions}
              isOpen={isDistributionChannelDropdownOpen}
              onToggleOpen={onToggleDistributionChannelDropdown}
              onToggleValue={onToggleDistributionChannel}
              onToggleAll={onToggleAllDistributionChannel}
              selectedText={(count) => `${count}개 선택`}
            />
            <DateRangeFilterDropdown
              label="등록일"
              containerRef={datePickerRef}
              value={draftFilters.dateRange}
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
              label="검수 처리 시각"
              containerRef={allowedDatePickerRef}
              value={draftFilters.allowedDateRange}
              placeholder="검수 처리 기간 선택"
              selected={draftAllowedDateRange}
              isOpen={isAllowedDatePickerOpen}
              presetOptions={datePresetOptions}
              onToggleOpen={onToggleAllowedDatePicker}
              onSelect={(nextRange) => onApplyDateRange("allowed", nextRange)}
              onPresetSelect={(presetKey) => onApplyDatePreset("allowed", presetKey as DatePresetKey)}
              onReset={() => {
                onApplyDateRange("allowed", undefined);
                onToggleAllowedDatePicker();
              }}
              onConfirm={onToggleAllowedDatePicker}
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
