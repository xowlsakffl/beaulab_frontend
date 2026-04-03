import Link from "next/link";
import React from "react";
import type { DateRange } from "react-day-picker";

import { Can } from "@/components/common/guard";
import {
  Button,
  Card,
  CheckboxFilterDropdown,
  DateRangeFilterDropdown,
  InputField,
  SquarePlus,
} from "@beaulab/ui-admin";

import {
  ALLOW_STATUS_OPTIONS,
  APPROVAL_STATUS_OPTIONS,
  DATE_PRESET_OPTIONS,
  type DateFilterKey,
  type DatePresetKey,
  type Filters,
} from "@/lib/hospital/list";

type HospitalsFilterPanelProps = {
  draftFilters: Filters;
  draftDateRange?: DateRange;
  draftUpdatedDateRange?: DateRange;
  isStatusDropdownOpen: boolean;
  isReviewDropdownOpen: boolean;
  isDatePickerOpen: boolean;
  isUpdatedDatePickerOpen: boolean;
  statusDropdownRef: React.RefObject<HTMLDivElement | null>;
  reviewDropdownRef: React.RefObject<HTMLDivElement | null>;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  updatedDatePickerRef: React.RefObject<HTMLDivElement | null>;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onToggleStatusDropdown: () => void;
  onToggleReviewDropdown: () => void;
  onToggleDatePicker: () => void;
  onToggleUpdatedDatePicker: () => void;
  onToggleApprovalStatus: (value: string) => void;
  onToggleAllApprovalStatus: () => void;
  onToggleReviewStatus: (value: string) => void;
  onToggleAllReviewStatus: () => void;
  onApplyDateRange: (key: DateFilterKey, nextRange?: DateRange) => void;
  onApplyDatePreset: (key: DateFilterKey, preset: DatePresetKey) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function HospitalsFilterPanel({
  draftFilters,
  draftDateRange,
  draftUpdatedDateRange,
  isStatusDropdownOpen,
  isReviewDropdownOpen,
  isDatePickerOpen,
  isUpdatedDatePickerOpen,
  statusDropdownRef,
  reviewDropdownRef,
  datePickerRef,
  updatedDatePickerRef,
  searchInput,
  onSearchChange,
  onToggleStatusDropdown,
  onToggleReviewDropdown,
  onToggleDatePicker,
  onToggleUpdatedDatePicker,
  onToggleApprovalStatus,
  onToggleAllApprovalStatus,
  onToggleReviewStatus,
  onToggleAllReviewStatus,
  onApplyDateRange,
  onApplyDatePreset,
  onApplyFilters,
  onResetFilters,
}: HospitalsFilterPanelProps) {
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
            selectedValues={draftFilters.approvalStatuses}
            options={APPROVAL_STATUS_OPTIONS}
            isOpen={isStatusDropdownOpen}
            onToggleOpen={onToggleStatusDropdown}
            onToggleValue={onToggleApprovalStatus}
            onToggleAll={onToggleAllApprovalStatus}
          />
        </div>
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>검수 상태</span>
          <CheckboxFilterDropdown
            label="검수 상태"
            hideLabel
            containerRef={reviewDropdownRef}
            selectedValues={draftFilters.reviewStatuses}
            options={ALLOW_STATUS_OPTIONS}
            isOpen={isReviewDropdownOpen}
            onToggleOpen={onToggleReviewDropdown}
            onToggleValue={onToggleReviewStatus}
            onToggleAll={onToggleAllReviewStatus}
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
      </div>

      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full flex-1 lg:max-w-none">
          <InputField
            value={searchInput}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onApplyFilters();
              }
            }}
            placeholder="ID, 병의원명, 연락처 검색"
            className="bg-white dark:bg-gray-800"
          />
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="brand" onClick={onApplyFilters} size="sm" className="h-11 px-5">
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
          <Can permission="beaulab.hospital.create">
            <Link href="/hospitals/new">
              <Button type="button" variant="brand" size="sm" className="h-11 px-5">
                <SquarePlus className="size-5" />
                <span>병의원 등록</span>
              </Button>
            </Link>
          </Can>
        </div>
      </div>
    </Card>
  );
}
