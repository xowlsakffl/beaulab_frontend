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
  Select,
  SquarePlus,
} from "@beaulab/ui-admin";

import { Can } from "@/components/common/guard";
import {
  HOSPITAL_EVENT_ALLOW_STATUS_OPTIONS,
  HOSPITAL_EVENT_AMOUNT_METRIC_OPTIONS,
  HOSPITAL_EVENT_DATE_PRESET_OPTIONS,
  HOSPITAL_EVENT_DATE_TYPE_OPTIONS,
  HOSPITAL_EVENT_QUANTITY_METRIC_OPTIONS,
  HOSPITAL_EVENT_VISIBILITY_OPTIONS,
  type HospitalEventAmountMetric,
  type HospitalEventDatePresetKey,
  type HospitalEventDateType,
  type HospitalEventFilters,
  type HospitalEventQuantityMetric,
} from "@/lib/hospital-event/list";

type SelectOption = {
  value: string;
  label: string;
};

type HospitalEventsFilterPanelProps = {
  searchInput: string;
  draftFilters: HospitalEventFilters;
  draftDateRange?: DateRange;
  majorCategoryOptions: SelectOption[];
  middleCategoryOptions: SelectOption[];
  isDatePickerOpen: boolean;
  isAllowStatusDropdownOpen: boolean;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  allowStatusDropdownRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onToggleDatePicker: () => void;
  onToggleAllowStatusDropdown: () => void;
  onToggleDateType: (value: HospitalEventDateType) => void;
  onToggleAllowStatus: (value: string) => void;
  onToggleAllAllowStatus: () => void;
  onApplyDateRange: (nextRange?: DateRange) => void;
  onApplyDatePreset: (preset: HospitalEventDatePresetKey) => void;
  onVisibilityChange: (value: string) => void;
  onMajorCategoryChange: (value: string) => void;
  onMiddleCategoryChange: (value: string) => void;
  onQuantityMetricChange: (value: HospitalEventQuantityMetric) => void;
  onQuantityMinChange: (value: string) => void;
  onQuantityMaxChange: (value: string) => void;
  onAmountMetricChange: (value: HospitalEventAmountMetric) => void;
  onAmountMinChange: (value: string) => void;
  onAmountMaxChange: (value: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function HospitalEventsFilterPanel({
  searchInput,
  draftFilters,
  draftDateRange,
  majorCategoryOptions,
  middleCategoryOptions,
  isDatePickerOpen,
  isAllowStatusDropdownOpen,
  datePickerRef,
  allowStatusDropdownRef,
  onSearchChange,
  onToggleDatePicker,
  onToggleAllowStatusDropdown,
  onToggleDateType,
  onToggleAllowStatus,
  onToggleAllAllowStatus,
  onApplyDateRange,
  onApplyDatePreset,
  onVisibilityChange,
  onMajorCategoryChange,
  onMiddleCategoryChange,
  onQuantityMetricChange,
  onQuantityMinChange,
  onQuantityMaxChange,
  onAmountMetricChange,
  onAmountMinChange,
  onAmountMaxChange,
  onApplyFilters,
  onResetFilters,
}: HospitalEventsFilterPanelProps) {
  const filterRowClass = "flex min-w-0 items-center gap-3 py-1.5";
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 ";
  const handleEnterToSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onApplyFilters();
    }
  };

  return (
    <Card className="min-w-0 rounded-xl p-3 ">
      <div className="space-y-3">
        <div className="grid min-w-0 grid-cols-1 gap-x-3 gap-y-3 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.45fr)_minmax(0,1.5fr)]">
          <div className={filterRowClass}>
            <span className={inlineLabelClass}>기간</span>
            <div className="flex min-w-0 flex-1 flex-col gap-3 2xl:flex-row 2xl:items-center">
              <DateRangeFilterDropdown
                label="기간"
                hideLabel
                containerRef={datePickerRef}
                value={draftFilters.dateRange}
                placeholder="기간 선택"
                selected={draftDateRange}
                isOpen={isDatePickerOpen}
                presetOptions={HOSPITAL_EVENT_DATE_PRESET_OPTIONS}
                onToggleOpen={onToggleDatePicker}
                onSelect={onApplyDateRange}
                onPresetSelect={(presetKey) => onApplyDatePreset(presetKey as HospitalEventDatePresetKey)}
                onReset={() => {
                  onApplyDateRange(undefined);
                  onToggleDatePicker();
                }}
                onConfirm={onToggleDatePicker}
              />
              <div className="flex shrink-0 items-center gap-5 px-1">
                {HOSPITAL_EVENT_DATE_TYPE_OPTIONS.map((option) => (
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
            <span className={inlineLabelClass}>노출여부</span>
            <div className="min-w-0 flex-1">
              <Select
                value={draftFilters.visibilityStatus}
                options={HOSPITAL_EVENT_VISIBILITY_OPTIONS}
                showPlaceholderOption={false}
                onChange={onVisibilityChange}
                className="h-11 px-3"
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>카테고리</span>
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
              <Select
                value={draftFilters.majorCategoryId}
                options={majorCategoryOptions}
                showPlaceholderOption={false}
                onChange={onMajorCategoryChange}
                className="h-11 px-3"
              />
              <Select
                value={draftFilters.middleCategoryId}
                options={middleCategoryOptions}
                showPlaceholderOption={false}
                disabled={!draftFilters.majorCategoryId}
                onChange={onMiddleCategoryChange}
                className="h-11 px-3"
              />
            </div>
          </div>

          <MetricRangeFilter
            label="수량"
            metricValue={draftFilters.quantityMetric}
            metricOptions={HOSPITAL_EVENT_QUANTITY_METRIC_OPTIONS}
            minValue={draftFilters.quantityMin}
            maxValue={draftFilters.quantityMax}
            onMetricChange={(value) => onQuantityMetricChange(value as HospitalEventQuantityMetric)}
            onMinChange={onQuantityMinChange}
            onMaxChange={onQuantityMaxChange}
            onEnter={handleEnterToSearch}
          />
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-x-3 gap-y-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)_minmax(0,2.4fr)]">
          <div className={filterRowClass}>
            <span className={inlineLabelClass}>검수상태</span>
            <div className="min-w-0 flex-1">
              <CheckboxFilterDropdown
                label="검수상태"
                hideLabel
                containerRef={allowStatusDropdownRef}
                selectedValues={draftFilters.allowStatuses}
                options={HOSPITAL_EVENT_ALLOW_STATUS_OPTIONS}
                isOpen={isAllowStatusDropdownOpen}
                onToggleOpen={onToggleAllowStatusDropdown}
                onToggleValue={onToggleAllowStatus}
                onToggleAll={onToggleAllAllowStatus}
              />
            </div>
          </div>

          <MetricRangeFilter
            label="금액"
            metricValue={draftFilters.amountMetric}
            metricOptions={HOSPITAL_EVENT_AMOUNT_METRIC_OPTIONS}
            minValue={draftFilters.amountMin}
            maxValue={draftFilters.amountMax}
            onMetricChange={(value) => onAmountMetricChange(value as HospitalEventAmountMetric)}
            onMinChange={onAmountMinChange}
            onMaxChange={onAmountMaxChange}
            onEnter={handleEnterToSearch}
          />

          <div className="flex min-w-0 flex-col gap-3 py-1.5 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className={inlineLabelClass}>검색</span>
              <div className="min-w-0 flex-1">
                <InputField
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={handleEnterToSearch}
                  placeholder="병의원명, 이벤트명, 담당자를 입력해주세요"
                  className="bg-white "
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
                className="h-11 border-brand-500 px-5 text-brand-500 hover:bg-gray-100 "
              >
                검색 초기화
              </Button>
              <Can permission="beaulab.hospital_event.create">
                <Link href="/events/new">
                  <Button type="button" variant="brand" size="sm" className="h-11 px-5">
                    <SquarePlus className="size-5" />
                    <span>이벤트 등록</span>
                  </Button>
                </Link>
              </Can>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function MetricRangeFilter({
  label,
  metricValue,
  metricOptions,
  minValue,
  maxValue,
  onMetricChange,
  onMinChange,
  onMaxChange,
  onEnter,
}: {
  label: string;
  metricValue: string;
  metricOptions: { value: string; label: string }[];
  minValue: string;
  maxValue: string;
  onMetricChange: (value: string) => void;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onEnter: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 ";

  return (
    <div className="flex min-w-0 items-center gap-3 py-1.5">
      <span className={inlineLabelClass}>{label}</span>
      <div className="grid min-w-0 flex-1 grid-cols-[minmax(7rem,0.9fr)_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <Select
          value={metricValue}
          options={metricOptions}
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
          className="bg-white px-3 "
        />
        <span className="text-sm text-gray-400">~</span>
        <InputField
          type="number"
          min="0"
          value={maxValue}
          onChange={(event) => onMaxChange(event.target.value)}
          onKeyDown={onEnter}
          placeholder="999999999"
          className="bg-white px-3 "
        />
      </div>
    </div>
  );
}
