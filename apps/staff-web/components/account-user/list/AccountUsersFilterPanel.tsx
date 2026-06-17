"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import {
  Button,
  Card,
  DateRangeFilterDropdown,
  FormCheckbox,
  InputField,
  SingleCheckboxFilterDropdown,
} from "@beaulab/ui-admin";

import {
  ACCOUNT_USER_DATE_PRESET_OPTIONS,
  ACCOUNT_USER_DATE_TYPE_OPTIONS,
  ACCOUNT_USER_SIGNUP_CHANNEL_OPTIONS,
  ACCOUNT_USER_STATUS_OPTIONS,
  type AccountUserDateType,
  type AccountUserFilters,
} from "@/lib/account-user/list";

type AccountUsersFilterPanelProps = {
  searchInput: string;
  draftFilters: AccountUserFilters;
  draftDateRange?: DateRange;
  isDatePickerOpen: boolean;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onDateTypeChange: (value: AccountUserDateType) => void;
  onToggleDatePicker: () => void;
  onApplyDateRange: (nextRange?: DateRange) => void;
  onApplyDatePreset: (preset: string) => void;
  onSignupChannelChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onWarningCountMinChange: (value: string) => void;
  onWarningCountMaxChange: (value: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function AccountUsersFilterPanel({
  searchInput,
  draftFilters,
  draftDateRange,
  isDatePickerOpen,
  datePickerRef,
  onSearchChange,
  onDateTypeChange,
  onToggleDatePicker,
  onApplyDateRange,
  onApplyDatePreset,
  onSignupChannelChange,
  onStatusChange,
  onWarningCountMinChange,
  onWarningCountMaxChange,
  onApplyFilters,
  onResetFilters,
}: AccountUsersFilterPanelProps) {
  const filterRowClass = "flex min-w-0 items-center gap-2 py-1.5";
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 ";

  const handleEnterToSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    onApplyFilters();
  };

  return (
    <Card className="min-w-0 rounded-xl p-3 ">
      <div className="space-y-3">
        <div className="grid min-w-0 grid-cols-[minmax(0,2.1fr)_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-x-3 gap-y-3 max-[1800px]:grid-cols-[minmax(0,2.1fr)_minmax(0,1.15fr)]">
          <div className={filterRowClass}>
            <span className={inlineLabelClass}>기간</span>
            <div className="flex min-w-0 flex-1 flex-row items-center gap-6">
              <DateRangeFilterDropdown
                label="기간"
                hideLabel
                containerRef={datePickerRef}
                value={draftFilters.dateRange}
                placeholder="기간 선택"
                selected={draftDateRange}
                isOpen={isDatePickerOpen}
                presetOptions={ACCOUNT_USER_DATE_PRESET_OPTIONS}
                onToggleOpen={onToggleDatePicker}
                onSelect={onApplyDateRange}
                onPresetSelect={(presetKey) => onApplyDatePreset(String(presetKey))}
                onReset={() => {
                  onApplyDateRange(undefined);
                  onToggleDatePicker();
                }}
                onConfirm={onToggleDatePicker}
              />
              <div className="flex shrink-0 items-center gap-5 px-1">
                {ACCOUNT_USER_DATE_TYPE_OPTIONS.map((option) => (
                  <FormCheckbox
                    key={option.value}
                    checked={draftFilters.dateType === option.value}
                    onChange={() => onDateTypeChange(option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>가입경로</span>
            <div className="min-w-0 flex-1">
              <SingleCheckboxFilterDropdown
                label="가입경로"
                hideLabel
                value={draftFilters.signupChannel}
                options={ACCOUNT_USER_SIGNUP_CHANNEL_OPTIONS}
                onChange={onSignupChannelChange}
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>회원상태</span>
            <div className="min-w-0 flex-1">
              <SingleCheckboxFilterDropdown
                label="회원상태"
                hideLabel
                value={draftFilters.status}
                options={ACCOUNT_USER_STATUS_OPTIONS}
                onChange={onStatusChange}
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>경고횟수</span>
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <InputField
                type="number"
                min="0"
                value={draftFilters.warningCountMin}
                onChange={(event) => onWarningCountMinChange(event.target.value)}
                onKeyDown={handleEnterToSearch}
                className="bg-white px-3 "
              />
              <span className="text-sm text-gray-400">~</span>
              <InputField
                type="number"
                min="0"
                value={draftFilters.warningCountMax}
                onChange={(event) => onWarningCountMaxChange(event.target.value)}
                onKeyDown={handleEnterToSearch}
                className="bg-white px-3 "
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
                placeholder="UID, 이메일, 닉네임 등을 입력해주세요"
                className="w-full bg-white "
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
          </div>
        </div>
      </div>
    </Card>
  );
}
