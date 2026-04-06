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

import type { DateFilterKey, DatePresetKey } from "@/lib/notice/list";

type NoticesFilterPanelProps = {
  searchInput: string;
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
  onSearchChange: (value: string) => void;
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
  searchInput,
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
  onSearchChange,
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
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 dark:text-gray-300";

  return (
    <Card className="rounded-xl p-3 dark:border-white/[0.05]">
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(15rem,1.2fr)_minmax(15rem,1.2fr)]">
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>운영 상태</span>
          <CheckboxFilterDropdown
            label="운영 상태"
            hideLabel
            containerRef={statusDropdownRef}
            selectedValues={draftStatuses}
            options={statusOptions}
            isOpen={isStatusDropdownOpen}
            onToggleOpen={onToggleStatusDropdown}
            onToggleValue={onToggleStatus}
            onToggleAll={onToggleAllStatuses}
          />
        </div>
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>채널</span>
          <CheckboxFilterDropdown
            label="채널"
            hideLabel
            containerRef={channelDropdownRef}
            selectedValues={draftChannels}
            options={channelOptions}
            isOpen={isChannelDropdownOpen}
            onToggleOpen={onToggleChannelDropdown}
            onToggleValue={onToggleChannel}
            onToggleAll={onToggleAllChannels}
            allLabel="전체 선택"
          />
        </div>
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>등록일</span>
          <DateRangeFilterDropdown
            label="등록일"
            hideLabel
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
        </div>
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>수정일</span>
          <DateRangeFilterDropdown
            label="수정일"
            hideLabel
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
            <Can permission="beaulab.notice.create">
              <Link href="/notices/new">
                <Button type="button" variant="brand" size="sm" className="h-11 px-5">
                  <SquarePlus className="size-5" />
                  <span>공지사항 등록</span>
                </Button>
              </Link>
            </Can>
          </div>
        </div>
      </div>
    </Card>
  );
}
