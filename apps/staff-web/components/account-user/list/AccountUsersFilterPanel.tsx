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
  const warningCountMin = Number(draftFilters.warningCountMin);
  const warningCountMax = Number(draftFilters.warningCountMax);
  const isWarningRangeInvalid =
    draftFilters.warningCountMin !== "" && draftFilters.warningCountMax !== "" && warningCountMax < warningCountMin;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isWarningRangeInvalid) return;

    onApplyFilters();
  };

  const filterRowClassName = "flex min-w-0 items-center gap-3";
  const filterLabelClassName = "w-[72px] shrink-0 text-right text-sm font-medium text-gray-600";

  return (
    <Card className="min-w-0 rounded-xl p-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid min-w-0 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-5">
          <div className={`${filterRowClassName} md:col-span-2 xl:col-span-2`}>
            <span className={filterLabelClassName}>기간</span>
            <div className="flex min-w-0 flex-1 items-center gap-4">
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
              <div className="flex shrink-0 items-center gap-4">
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

          <div className={filterRowClassName}>
            <span className={filterLabelClassName}>가입경로</span>
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

          <div className={filterRowClassName}>
            <span className={filterLabelClassName}>회원상태</span>
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

          <div className={filterRowClassName}>
            <span className={filterLabelClassName}>경고횟수</span>
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <InputField
                type="number"
                min="0"
                inputMode="numeric"
                value={draftFilters.warningCountMin}
                onChange={(event) => onWarningCountMinChange(event.target.value)}
                placeholder="최소"
                className="bg-white px-3"
                error={isWarningRangeInvalid}
              />
              <span className="text-sm text-gray-400">~</span>
              <InputField
                type="number"
                min="0"
                inputMode="numeric"
                value={draftFilters.warningCountMax}
                onChange={(event) => onWarningCountMaxChange(event.target.value)}
                placeholder="최대"
                className="bg-white px-3"
                error={isWarningRangeInvalid}
              />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <div className={`${filterRowClassName} min-w-0 flex-1`}>
            <label htmlFor="account-user-search" className={filterLabelClassName}>
              검색
            </label>
            <div className="min-w-0 flex-1">
              <InputField
                id="account-user-search"
                value={searchInput}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="UID, 이메일, 닉네임, 이름을 입력해 주세요."
                className="bg-white"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2">
            <Button type="submit" variant="brand" size="filter" disabled={isWarningRangeInvalid}>
              검색
            </Button>
            <Button type="button" variant="brandOutline" size="filter" onClick={onResetFilters}>
              검색 초기화
            </Button>
          </div>
        </div>

        {isWarningRangeInvalid ? (
          <p className="pr-1 text-right text-xs text-error-500">최대 경고횟수는 최소 경고횟수 이상이어야 합니다.</p>
        ) : null}
      </form>
    </Card>
  );
}
