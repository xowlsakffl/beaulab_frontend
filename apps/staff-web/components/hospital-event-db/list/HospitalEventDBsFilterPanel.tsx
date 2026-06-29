"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import {
  Button,
  Card,
  DateRangeFilterDropdown,
  InputField,
  Select,
  SingleCheckboxFilterDropdown,
} from "@beaulab/ui-admin";

import {
  HOSPITAL_EVENT_DB_ALLOW_STATUS_OPTIONS,
  HOSPITAL_EVENT_DB_AMOUNT_METRIC_OPTIONS,
  HOSPITAL_EVENT_DB_CONTACT_METHOD_OPTIONS,
  HOSPITAL_EVENT_DB_DATE_PRESET_OPTIONS,
  HOSPITAL_EVENT_DB_PREFERRED_TIME_OPTIONS,
  HOSPITAL_EVENT_DB_STATUS_OPTIONS,
  type HospitalEventDBAmountMetric,
  type HospitalEventDBDatePresetKey,
  type HospitalEventDBFilters,
} from "@/lib/hospital-event-db/list";

type HospitalEventDBsFilterPanelProps = {
  searchInput: string;
  draftFilters: HospitalEventDBFilters;
  draftDateRange?: DateRange;
  isDatePickerOpen: boolean;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onToggleDatePicker: () => void;
  onApplyDateRange: (nextRange?: DateRange) => void;
  onApplyDatePreset: (preset: HospitalEventDBDatePresetKey) => void;
  onContactMethodChange: (value: string) => void;
  onPreferredTimeChange: (value: string) => void;
  onAmountMetricChange: (value: HospitalEventDBAmountMetric) => void;
  onAmountMinChange: (value: string) => void;
  onAmountMaxChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onAllowStatusChange: (value: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function HospitalEventDBsFilterPanel({
  searchInput,
  draftFilters,
  draftDateRange,
  isDatePickerOpen,
  datePickerRef,
  onSearchChange,
  onToggleDatePicker,
  onApplyDateRange,
  onApplyDatePreset,
  onContactMethodChange,
  onPreferredTimeChange,
  onAmountMetricChange,
  onAmountMinChange,
  onAmountMaxChange,
  onStatusChange,
  onAllowStatusChange,
  onApplyFilters,
  onResetFilters,
}: HospitalEventDBsFilterPanelProps) {
  const filterRowClass = "flex min-w-0 items-center gap-2 py-1.5";
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 ";

  const handleEnterToSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    onApplyFilters();
  };

  return (
    <Card className="min-w-0 rounded-xl p-3">
      <div className="space-y-3">
        <div className="grid min-w-0 grid-cols-[minmax(0,1.55fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,1.5fr)] gap-x-3 gap-y-3">
          <div className={filterRowClass}>
            <span className={inlineLabelClass}>기간</span>
            <div className="min-w-0 flex-1">
              <DateRangeFilterDropdown
                label="기간"
                hideLabel
                containerRef={datePickerRef}
                value={draftFilters.dateRange}
                placeholder="신청일 기간 선택"
                selected={draftDateRange}
                isOpen={isDatePickerOpen}
                presetOptions={HOSPITAL_EVENT_DB_DATE_PRESET_OPTIONS}
                onToggleOpen={onToggleDatePicker}
                onSelect={onApplyDateRange}
                onPresetSelect={(presetKey) => onApplyDatePreset(presetKey as HospitalEventDBDatePresetKey)}
                onReset={() => {
                  onApplyDateRange(undefined);
                  onToggleDatePicker();
                }}
                onConfirm={onToggleDatePicker}
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>연락수단</span>
            <div className="min-w-0 flex-1">
              <SingleCheckboxFilterDropdown
                label="연락수단"
                hideLabel
                value={draftFilters.contactMethod}
                options={HOSPITAL_EVENT_DB_CONTACT_METHOD_OPTIONS}
                onChange={onContactMethodChange}
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>선호시간</span>
            <div className="min-w-0 flex-1">
              <SingleCheckboxFilterDropdown
                label="선호시간"
                hideLabel
                value={draftFilters.preferredTime}
                options={HOSPITAL_EVENT_DB_PREFERRED_TIME_OPTIONS}
                onChange={onPreferredTimeChange}
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>상담여부</span>
            <div className="min-w-0 flex-1">
              <SingleCheckboxFilterDropdown
                label="상담여부"
                hideLabel
                value={draftFilters.status}
                options={HOSPITAL_EVENT_DB_STATUS_OPTIONS}
                onChange={onStatusChange}
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>검증상태</span>
            <div className="min-w-0 flex-1">
              <SingleCheckboxFilterDropdown
                label="검증상태"
                hideLabel
                value={draftFilters.allowStatus}
                options={HOSPITAL_EVENT_DB_ALLOW_STATUS_OPTIONS}
                onChange={onAllowStatusChange}
              />
            </div>
          </div>

          <AmountRangeFilter
            label="금액"
            metricValue={draftFilters.amountMetric}
            minValue={draftFilters.amountMin}
            maxValue={draftFilters.amountMax}
            onMetricChange={(value) => onAmountMetricChange(value as HospitalEventDBAmountMetric)}
            onMinChange={onAmountMinChange}
            onMaxChange={onAmountMaxChange}
            onEnter={handleEnterToSearch}
          />
        </div>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-x-3 gap-y-3">
          <div className="flex min-w-0 flex-row items-center gap-2 py-1.5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className={inlineLabelClass}>검색</span>
              <div className="min-w-0 flex-1">
                <InputField
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={handleEnterToSearch}
                  placeholder="EDID, 병의원, 이벤트, 이름, 전화번호를 입력해주세요"
                  className="w-full bg-white"
                />
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <Button type="button" variant="brand" size="filter" onClick={onApplyFilters} className="shrink-0">
                검색
              </Button>
              <Button type="button" variant="brandOutline" size="filter" onClick={onResetFilters} className="shrink-0">
                검색 초기화
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AmountRangeFilter({
  label,
  metricValue,
  minValue,
  maxValue,
  onMetricChange,
  onMinChange,
  onMaxChange,
  onEnter,
}: {
  label: string;
  metricValue: HospitalEventDBAmountMetric;
  minValue: string;
  maxValue: string;
  onMetricChange: (value: string) => void;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onEnter: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 py-1.5">
      <span className="w-16 shrink-0 text-right text-sm font-medium whitespace-nowrap text-gray-600">{label}</span>
      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_auto_minmax(0,0.8fr)] items-center gap-2">
        <Select
          value={metricValue}
          options={HOSPITAL_EVENT_DB_AMOUNT_METRIC_OPTIONS}
          showPlaceholderOption={false}
          onChange={onMetricChange}
          className="h-11 px-3"
        />
        <InputField
          type="number"
          min="0"
          value={minValue}
          onChange={(event) => onMinChange(event.target.value)}
          onKeyDown={onEnter}
          placeholder="0"
          className="bg-white px-3"
        />
        <span className="text-sm text-gray-400">~</span>
        <InputField
          type="number"
          min="0"
          value={maxValue}
          onChange={(event) => onMaxChange(event.target.value)}
          onKeyDown={onEnter}
          placeholder="999999999"
          className="bg-white px-3"
        />
      </div>
    </div>
  );
}
