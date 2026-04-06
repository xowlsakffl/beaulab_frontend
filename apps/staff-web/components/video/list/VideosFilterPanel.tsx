import Link from "next/link";
import React from "react";

import { Can } from "@/components/common/guard";
import {
  Button,
  Card,
  CheckboxFilterDropdown,
  DateRangeFilterDropdown,
  InputField,
  SquarePlus,
  type CheckboxFilterOption,
} from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

import type { DateFilterKey, DatePresetKey, Filters } from "@/lib/video/list";

type VideosFilterPanelProps = {
  searchInput: string;
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
  onSearchChange: (value: string) => void;
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
  searchInput,
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
  onSearchChange,
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
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 dark:text-gray-300";

  return (
    <Card className="rounded-xl p-3 dark:border-white/[0.05]">
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(15rem,1.2fr)_minmax(15rem,1.2fr)]">
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>운영 상태</span>
          <CheckboxFilterDropdown
            label="운영 상태"
            hideLabel
            containerRef={operatingStatusDropdownRef}
            selectedValues={draftFilters.operatingStatuses}
            options={operatingStatusOptions}
            isOpen={isOperatingStatusDropdownOpen}
            onToggleOpen={onToggleOperatingStatusDropdown}
            onToggleValue={onToggleOperatingStatus}
            onToggleAll={onToggleAllOperatingStatus}
          />
        </div>
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>검수 상태</span>
          <CheckboxFilterDropdown
            label="검수 상태"
            hideLabel
            containerRef={approvalStatusDropdownRef}
            selectedValues={draftFilters.approvalStatuses}
            options={approvalStatusOptions}
            isOpen={isApprovalStatusDropdownOpen}
            onToggleOpen={onToggleApprovalStatusDropdown}
            onToggleValue={onToggleApprovalStatus}
            onToggleAll={onToggleAllApprovalStatus}
          />
        </div>
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>배포 채널</span>
          <CheckboxFilterDropdown
            label="배포 채널"
            hideLabel
            containerRef={distributionChannelDropdownRef}
            selectedValues={draftFilters.distributionChannels}
            options={distributionChannelOptions}
            isOpen={isDistributionChannelDropdownOpen}
            onToggleOpen={onToggleDistributionChannelDropdown}
            onToggleValue={onToggleDistributionChannel}
            onToggleAll={onToggleAllDistributionChannel}
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
        </div>
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>검수 처리</span>
          <DateRangeFilterDropdown
            label="검수 처리 시각"
            hideLabel
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
                placeholder="병의원명, 의료진명, 제목 검색"
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
            <Can permission="beaulab.video.create">
              <Link href="/videos/new">
                <Button type="button" variant="brand" size="sm" className="h-11 px-5">
                  <SquarePlus className="size-5" />
                  <span>동영상 등록</span>
                </Button>
              </Link>
            </Can>
          </div>
        </div>
      </div>
    </Card>
  );
}
