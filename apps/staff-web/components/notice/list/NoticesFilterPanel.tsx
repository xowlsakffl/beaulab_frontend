import React from "react";

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

import { Can } from "@/components/common/guard";
import type { DatePresetKey } from "@/lib/notice/list";

type NoticesFilterPanelProps = {
  searchInput: string;
  draftStatuses: string[];
  draftChannels: string[];
  draftDateLabel: string;
  draftDateRange?: DateRange;
  isStatusDropdownOpen: boolean;
  isChannelDropdownOpen: boolean;
  isDatePickerOpen: boolean;
  statusDropdownRef: React.RefObject<HTMLDivElement | null>;
  channelDropdownRef: React.RefObject<HTMLDivElement | null>;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  statusOptions: CheckboxFilterOption[];
  channelOptions: CheckboxFilterOption[];
  datePresetOptions: readonly { key: string; label: string }[];
  onSearchChange: (value: string) => void;
  onToggleStatusDropdown: () => void;
  onToggleChannelDropdown: () => void;
  onToggleDatePicker: () => void;
  onToggleStatus: (value: string) => void;
  onToggleChannel: (value: string) => void;
  onToggleAllStatuses: () => void;
  onToggleAllChannels: () => void;
  onApplyDateRange: (nextRange?: DateRange) => void;
  onApplyDatePreset: (preset: DatePresetKey) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  onOpenCreate: () => void;
};

export function NoticesFilterPanel({
  searchInput,
  draftStatuses,
  draftChannels,
  draftDateLabel,
  draftDateRange,
  isStatusDropdownOpen,
  isChannelDropdownOpen,
  isDatePickerOpen,
  statusDropdownRef,
  channelDropdownRef,
  datePickerRef,
  statusOptions,
  channelOptions,
  datePresetOptions,
  onSearchChange,
  onToggleStatusDropdown,
  onToggleChannelDropdown,
  onToggleDatePicker,
  onToggleStatus,
  onToggleChannel,
  onToggleAllStatuses,
  onToggleAllChannels,
  onApplyDateRange,
  onApplyDatePreset,
  onApplyFilters,
  onResetFilters,
  onOpenCreate,
}: NoticesFilterPanelProps) {
  const inlineLabelClass = "w-[72px] shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600";

  return (
    <Card className="min-w-0 rounded-xl p-3">
      <div className="grid min-w-0 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className={inlineLabelClass}>기간</span>
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
            onSelect={(nextRange) => onApplyDateRange(nextRange)}
            onPresetSelect={(presetKey) => onApplyDatePreset(presetKey as DatePresetKey)}
            onReset={() => {
              onApplyDateRange(undefined);
              onToggleDatePicker();
            }}
            onConfirm={onToggleDatePicker}
          />
        </div>
        <div className="flex min-w-0 items-center gap-3">
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
        <div className="flex min-w-0 items-center gap-3">
          <span className={inlineLabelClass}>공개여부</span>
          <CheckboxFilterDropdown
            label="공개여부"
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
        <div className="col-span-full flex min-w-0 flex-col gap-3 py-1.5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <label htmlFor="notice-search" className={inlineLabelClass}>
              검색
            </label>
            <div className="min-w-0 flex-1">
              <InputField
                id="notice-search"
                maxLength={100}
                value={searchInput}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onApplyFilters();
                  }
                }}
                placeholder="ID, 제목, 관리자 검색"
                className="bg-white"
              />
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="brand" onClick={onApplyFilters} size="filter" className="shrink-0">
              검색
            </Button>
            <Button type="button" variant="brandOutline" size="filter" onClick={onResetFilters} className="shrink-0">
              검색 초기화
            </Button>
            <Can permission="beaulab.notice.create">
              <Button type="button" variant="brand" size="filter" onClick={onOpenCreate}>
                <SquarePlus className="size-5" />
                <span>공지사항 등록</span>
              </Button>
            </Can>
          </div>
        </div>
      </div>
    </Card>
  );
}
