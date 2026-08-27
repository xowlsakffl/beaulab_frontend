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
  SingleCheckboxFilterDropdown,
  SquarePlus,
} from "@beaulab/ui-admin";

import { Can } from "@/components/common/guard";
import {
  HOSPITAL_EVENT_ADMIN_STATUS_OPTIONS,
  HOSPITAL_EVENT_ALLOW_STATUS_OPTIONS,
  HOSPITAL_EVENT_AMOUNT_METRIC_OPTIONS,
  HOSPITAL_EVENT_DATE_PRESET_OPTIONS,
  HOSPITAL_EVENT_DATE_TYPE_OPTIONS,
  HOSPITAL_EVENT_QUANTITY_METRIC_OPTIONS,
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
  onAdminStatusChange: (value: string) => void;
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
  onAdminStatusChange,
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
  const filterRowClass = "flex min-w-0 items-center gap-3";
  const inlineLabelClass = "w-[72px] shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600";
  const handleEnterToSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (isRangeInvalid) return;
      onApplyFilters();
    }
  };
  const isQuantityRangeInvalid =
    draftFilters.quantityMin !== "" &&
    draftFilters.quantityMax !== "" &&
    Number(draftFilters.quantityMax) < Number(draftFilters.quantityMin);
  const isAmountRangeInvalid =
    draftFilters.amountMin !== "" &&
    draftFilters.amountMax !== "" &&
    Number(draftFilters.amountMax) < Number(draftFilters.amountMin);
  const isRangeInvalid = isQuantityRangeInvalid || isAmountRangeInvalid;

  return (
    <Card className="min-w-0 rounded-xl p-3">
      <div className="space-y-3">
        <div className="grid min-w-0 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-11">
          <div className={`${filterRowClass} xl:order-1 md:col-span-2 xl:col-span-4`}>
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

          <div className={`${filterRowClass} xl:order-2 md:col-span-2 xl:col-span-3`}>
            <span className={inlineLabelClass}>카테고리</span>
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
              <Select
                value={draftFilters.majorCategoryId}
                options={majorCategoryOptions}
                showPlaceholderOption={false}
                onChange={onMajorCategoryChange}
                className="h-11 px-4"
              />
              <Select
                value={draftFilters.middleCategoryId}
                options={middleCategoryOptions}
                showPlaceholderOption={false}
                disabled={!draftFilters.majorCategoryId}
                onChange={onMiddleCategoryChange}
                className="h-11 px-4"
              />
            </div>
          </div>

          <div className={`${filterRowClass} xl:order-3 xl:col-span-2`}>
            <span className={inlineLabelClass}>강제중지</span>
            <div className="min-w-0 flex-1">
              <SingleCheckboxFilterDropdown
                label="강제중지"
                hideLabel
                value={draftFilters.adminStatus}
                options={HOSPITAL_EVENT_ADMIN_STATUS_OPTIONS}
                onChange={onAdminStatusChange}
              />
            </div>
          </div>

          <MetricRangeFilter
            className="xl:order-5 md:col-span-2 xl:col-span-3"
            label="수량"
            metricValue={draftFilters.quantityMetric}
            metricOptions={HOSPITAL_EVENT_QUANTITY_METRIC_OPTIONS}
            minValue={draftFilters.quantityMin}
            maxValue={draftFilters.quantityMax}
            onMetricChange={(value) => onQuantityMetricChange(value as HospitalEventQuantityMetric)}
            onMinChange={onQuantityMinChange}
            onMaxChange={onQuantityMaxChange}
            onEnter={handleEnterToSearch}
            error={isQuantityRangeInvalid}
          />

          <div className={`${filterRowClass} xl:order-4 xl:col-span-2`}>
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
            className="xl:order-6 md:col-span-2 xl:col-span-3"
            label="금액"
            metricValue={draftFilters.amountMetric}
            metricOptions={HOSPITAL_EVENT_AMOUNT_METRIC_OPTIONS}
            minValue={draftFilters.amountMin}
            maxValue={draftFilters.amountMax}
            onMetricChange={(value) => onAmountMetricChange(value as HospitalEventAmountMetric)}
            onMinChange={onAmountMinChange}
            onMaxChange={onAmountMaxChange}
            onEnter={handleEnterToSearch}
            error={isAmountRangeInvalid}
          />

          <div className="flex min-w-0 flex-col gap-3 py-1.5 xl:order-7 md:col-span-2 xl:col-span-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
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
              <Button
                type="button"
                variant="brand"
                onClick={onApplyFilters}
                size="filter"
                className="shrink-0"
                disabled={isRangeInvalid}
              >
                검색
              </Button>
              <Button type="button" variant="brandOutline" size="filter" onClick={onResetFilters} className="shrink-0">
                검색 초기화
              </Button>
              <Can permission="beaulab.hospital_event.create">
                <Link href="/ads-manage/events/new">
                  <Button type="button" variant="brand" size="filter">
                    <SquarePlus className="size-5" />
                    <span>이벤트 등록</span>
                  </Button>
                </Link>
              </Can>
            </div>
          </div>
        </div>

        {isRangeInvalid ? (
          <p className="text-right text-xs text-error-500">최대값은 최소값 이상이어야 합니다.</p>
        ) : null}
      </div>
    </Card>
  );
}

function MetricRangeFilter({
  className,
  label,
  metricValue,
  metricOptions,
  minValue,
  maxValue,
  onMetricChange,
  onMinChange,
  onMaxChange,
  onEnter,
  error = false,
}: {
  className?: string;
  label: string;
  metricValue: string;
  metricOptions: { value: string; label: string }[];
  minValue: string;
  maxValue: string;
  onMetricChange: (value: string) => void;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onEnter: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  error?: boolean;
}) {
  const inlineLabelClass = "w-[72px] shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600";

  return (
    <div className={["flex min-w-0 items-center gap-3", className].filter(Boolean).join(" ")}>
      <span className={inlineLabelClass}>{label}</span>
      <div className="grid min-w-0 flex-1 grid-cols-[minmax(5.5rem,1fr)_minmax(0,0.75fr)_auto_minmax(0,0.75fr)] items-center gap-2">
        <Select
          value={metricValue}
          options={metricOptions}
          showPlaceholderOption={false}
          onChange={onMetricChange}
          className="h-11 px-4"
        />
        <InputField
          type="number"
          min="0"
          value={minValue}
          onChange={(event) => onMinChange(event.target.value)}
          onKeyDown={onEnter}
          placeholder="0"
          className="bg-white px-3"
          error={error}
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
          error={error}
        />
      </div>
    </div>
  );
}
