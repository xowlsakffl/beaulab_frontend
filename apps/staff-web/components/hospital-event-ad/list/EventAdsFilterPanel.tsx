"use client";

import Link from "next/link";
import React from "react";
import type { DateRange } from "react-day-picker";
import {
  Button,
  Card,
  CheckboxFilterDropdown,
  DateRangeFilterDropdown,
  FormCheckbox,
  InputField,
  SquarePlus,
} from "@beaulab/ui-admin";

import { Can } from "@/components/common/guard";
import {
  EVENT_AD_ALLOW_STATUS_OPTIONS,
  EVENT_AD_DATE_PRESET_OPTIONS,
  EVENT_AD_DATE_TYPE_OPTIONS,
  EVENT_AD_PLACEMENT_OPTIONS,
  EVENT_AD_STATUS_OPTIONS,
  type EventAdDatePresetKey,
  type EventAdDateType,
  type EventAdFilters,
} from "@/lib/hospital-event-ad/list";

type EventAdsFilterPanelProps = {
  searchInput: string;
  draftFilters: EventAdFilters;
  draftDateRange?: DateRange;
  isDatePickerOpen: boolean;
  isPlacementDropdownOpen: boolean;
  isAllowStatusDropdownOpen: boolean;
  isAdStatusDropdownOpen: boolean;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  placementDropdownRef: React.RefObject<HTMLDivElement | null>;
  allowStatusDropdownRef: React.RefObject<HTMLDivElement | null>;
  adStatusDropdownRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onToggleDatePicker: () => void;
  onTogglePlacementDropdown: () => void;
  onToggleAllowStatusDropdown: () => void;
  onToggleAdStatusDropdown: () => void;
  onToggleDateType: (value: EventAdDateType) => void;
  onTogglePlacement: (value: string) => void;
  onToggleAllPlacement: () => void;
  onToggleAllowStatus: (value: string) => void;
  onToggleAllAllowStatus: () => void;
  onToggleAdStatus: (value: string) => void;
  onToggleAllAdStatus: () => void;
  onApplyDateRange: (nextRange?: DateRange) => void;
  onApplyDatePreset: (preset: EventAdDatePresetKey) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function EventAdsFilterPanel({
  searchInput,
  draftFilters,
  draftDateRange,
  isDatePickerOpen,
  isPlacementDropdownOpen,
  isAllowStatusDropdownOpen,
  isAdStatusDropdownOpen,
  datePickerRef,
  placementDropdownRef,
  allowStatusDropdownRef,
  adStatusDropdownRef,
  onSearchChange,
  onToggleDatePicker,
  onTogglePlacementDropdown,
  onToggleAllowStatusDropdown,
  onToggleAdStatusDropdown,
  onToggleDateType,
  onTogglePlacement,
  onToggleAllPlacement,
  onToggleAllowStatus,
  onToggleAllAllowStatus,
  onToggleAdStatus,
  onToggleAllAdStatus,
  onApplyDateRange,
  onApplyDatePreset,
  onApplyFilters,
  onResetFilters,
}: EventAdsFilterPanelProps) {
  const filterRowClass = "flex min-w-0 items-center gap-2 py-1.5";
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 ";

  const handleEnterToSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onApplyFilters();
    }
  };

  return (
    <Card className="min-w-0 rounded-xl p-3">
      <div className="space-y-3">
        <div className="grid min-w-0 grid-cols-[minmax(0,2.2fr)_minmax(0,1.15fr)_minmax(0,0.95fr)_minmax(0,0.95fr)] gap-x-3 gap-y-3 max-[1800px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className={filterRowClass}>
            <span className={inlineLabelClass}>기간</span>
            <div className="flex min-w-0 flex-1 flex-row items-center gap-2">
              <DateRangeFilterDropdown
                label="기간"
                hideLabel
                containerRef={datePickerRef}
                value={draftFilters.dateRange}
                placeholder="기간 선택"
                selected={draftDateRange}
                isOpen={isDatePickerOpen}
                presetOptions={EVENT_AD_DATE_PRESET_OPTIONS}
                onToggleOpen={onToggleDatePicker}
                onSelect={onApplyDateRange}
                onPresetSelect={(presetKey) => onApplyDatePreset(presetKey as EventAdDatePresetKey)}
                onReset={() => {
                  onApplyDateRange(undefined);
                  onToggleDatePicker();
                }}
                onConfirm={onToggleDatePicker}
              />
              <div className="flex shrink-0 items-center gap-5 px-1">
                {EVENT_AD_DATE_TYPE_OPTIONS.map((option) => (
                  <FormCheckbox
                    key={option.value}
                    checked={draftFilters.dateTypes.includes(option.value)}
                    onChange={() => onToggleDateType(option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>광고위치</span>
            <div className="min-w-0 flex-1">
              <CheckboxFilterDropdown
                label="광고위치"
                hideLabel
                containerRef={placementDropdownRef}
                selectedValues={draftFilters.placements}
                options={EVENT_AD_PLACEMENT_OPTIONS}
                isOpen={isPlacementDropdownOpen}
                onToggleOpen={onTogglePlacementDropdown}
                onToggleValue={onTogglePlacement}
                onToggleAll={onToggleAllPlacement}
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>검수상태</span>
            <div className="min-w-0 flex-1">
              <CheckboxFilterDropdown
                label="검수상태"
                hideLabel
                containerRef={allowStatusDropdownRef}
                selectedValues={draftFilters.allowStatuses}
                options={EVENT_AD_ALLOW_STATUS_OPTIONS}
                isOpen={isAllowStatusDropdownOpen}
                onToggleOpen={onToggleAllowStatusDropdown}
                onToggleValue={onToggleAllowStatus}
                onToggleAll={onToggleAllAllowStatus}
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>광고상태</span>
            <div className="min-w-0 flex-1">
              <CheckboxFilterDropdown
                label="광고상태"
                hideLabel
                containerRef={adStatusDropdownRef}
                selectedValues={draftFilters.adStatuses}
                options={EVENT_AD_STATUS_OPTIONS}
                isOpen={isAdStatusDropdownOpen}
                onToggleOpen={onToggleAdStatusDropdown}
                onToggleValue={onToggleAdStatus}
                onToggleAll={onToggleAllAdStatus}
              />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-row items-center gap-2 py-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className={inlineLabelClass}>검색</span>
            <div className="min-w-0 flex-1">
              <InputField
                value={searchInput}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={handleEnterToSearch}
                placeholder="병의원명, 이벤트명, 담당자를 입력해주세요"
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
            <Can permission="beaulab.hospital_event_ad.create">
              <Link href="/ads-manage/event-ads/new">
                <Button type="button" variant="brand" size="filter">
                  <SquarePlus className="size-5" />
                  <span>광고 등록</span>
                </Button>
              </Link>
            </Can>
          </div>
        </div>
      </div>
    </Card>
  );
}
