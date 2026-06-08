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
  Select,
  SquarePlus,
} from "@beaulab/ui-admin";

import {
  DATE_PRESET_OPTIONS,
  DOCTOR_APPROVAL_STATUS_OPTIONS,
  DOCTOR_METRIC_OPTIONS,
  DOCTOR_POSITION_OPTIONS,
  DOCTOR_SPECIALIST_FIELD_OPTIONS,
  type DateFilterKey,
  type DatePresetKey,
  type Filters,
} from "@/lib/doctor/list";

type DoctorsFilterPanelProps = {
  draftFilters: Filters;
  draftDateRange?: DateRange;
  isApprovalStatusDropdownOpen: boolean;
  isPositionDropdownOpen: boolean;
  isSpecialistFieldDropdownOpen: boolean;
  isCategoryDropdownOpen: boolean;
  isDatePickerOpen: boolean;
  approvalStatusDropdownRef: React.RefObject<HTMLDivElement | null>;
  positionDropdownRef: React.RefObject<HTMLDivElement | null>;
  specialistFieldDropdownRef: React.RefObject<HTMLDivElement | null>;
  categoryDropdownRef: React.RefObject<HTMLDivElement | null>;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  categoryOptions: { value: string; label: string }[];
  searchInput: string;
  onSearchChange: (value: string) => void;
  onToggleApprovalStatusDropdown: () => void;
  onTogglePositionDropdown: () => void;
  onToggleSpecialistFieldDropdown: () => void;
  onToggleCategoryDropdown: () => void;
  onToggleDatePicker: () => void;
  onToggleApprovalStatus: (value: string) => void;
  onTogglePosition: (value: string) => void;
  onToggleSpecialistField: (value: string) => void;
  onToggleCategory: (value: string) => void;
  onToggleAllApprovalStatus: () => void;
  onToggleAllPosition: () => void;
  onToggleAllSpecialistField: () => void;
  onToggleAllCategory: () => void;
  onMetricChange: (value: string) => void;
  onMetricMinChange: (value: string) => void;
  onMetricMaxChange: (value: string) => void;
  onApplyDateRange: (key: DateFilterKey, nextRange?: DateRange) => void;
  onApplyDatePreset: (key: DateFilterKey, preset: DatePresetKey) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function DoctorsFilterPanel({
  draftFilters,
  draftDateRange,
  isApprovalStatusDropdownOpen,
  isPositionDropdownOpen,
  isSpecialistFieldDropdownOpen,
  isCategoryDropdownOpen,
  isDatePickerOpen,
  approvalStatusDropdownRef,
  positionDropdownRef,
  specialistFieldDropdownRef,
  categoryDropdownRef,
  datePickerRef,
  categoryOptions,
  searchInput,
  onSearchChange,
  onToggleApprovalStatusDropdown,
  onTogglePositionDropdown,
  onToggleSpecialistFieldDropdown,
  onToggleCategoryDropdown,
  onToggleDatePicker,
  onToggleApprovalStatus,
  onTogglePosition,
  onToggleSpecialistField,
  onToggleCategory,
  onToggleAllApprovalStatus,
  onToggleAllPosition,
  onToggleAllSpecialistField,
  onToggleAllCategory,
  onMetricChange,
  onMetricMinChange,
  onMetricMaxChange,
  onApplyDateRange,
  onApplyDatePreset,
  onApplyFilters,
  onResetFilters,
}: DoctorsFilterPanelProps) {
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 ";
  const filterRowClass = "flex min-w-0 items-center gap-3 py-1.5";

  return (
    <Card className="rounded-xl p-3 ">
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 lg:grid-cols-2 2xl:grid-cols-[minmax(14rem,1.25fr)_minmax(10.5rem,0.9fr)_minmax(10.5rem,0.9fr)_minmax(9.5rem,0.8fr)_minmax(10.5rem,0.9fr)_minmax(24rem,1.8fr)]">
        <div className={filterRowClass}>
          <span className={inlineLabelClass}>기간</span>
          <DateRangeFilterDropdown
            label="기간"
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

        <div className={filterRowClass}>
          <span className={inlineLabelClass}>전문의</span>
          <CheckboxFilterDropdown
            label="전문의"
            hideLabel
            containerRef={specialistFieldDropdownRef}
            selectedValues={draftFilters.specialistFields}
            options={[...DOCTOR_SPECIALIST_FIELD_OPTIONS]}
            isOpen={isSpecialistFieldDropdownOpen}
            onToggleOpen={onToggleSpecialistFieldDropdown}
            onToggleValue={onToggleSpecialistField}
            onToggleAll={onToggleAllSpecialistField}
          />
        </div>

        <div className={filterRowClass}>
          <span className={inlineLabelClass}>진료분야</span>
          <CheckboxFilterDropdown
            label="진료분야"
            hideLabel
            containerRef={categoryDropdownRef}
            selectedValues={draftFilters.categoryIds}
            options={categoryOptions}
            isOpen={isCategoryDropdownOpen}
            onToggleOpen={onToggleCategoryDropdown}
            onToggleValue={onToggleCategory}
            onToggleAll={onToggleAllCategory}
          />
        </div>

        <div className={filterRowClass}>
          <span className={inlineLabelClass}>직책</span>
          <CheckboxFilterDropdown
            label="직책"
            hideLabel
            containerRef={positionDropdownRef}
            selectedValues={draftFilters.positions}
            options={DOCTOR_POSITION_OPTIONS}
            isOpen={isPositionDropdownOpen}
            onToggleOpen={onTogglePositionDropdown}
            onToggleValue={onTogglePosition}
            onToggleAll={onToggleAllPosition}
          />
        </div>

        <div className={filterRowClass}>
          <span className={inlineLabelClass}>검수상태</span>
          <CheckboxFilterDropdown
            label="검수상태"
            hideLabel
            containerRef={approvalStatusDropdownRef}
            selectedValues={draftFilters.approvalStatuses}
            options={DOCTOR_APPROVAL_STATUS_OPTIONS}
            isOpen={isApprovalStatusDropdownOpen}
            onToggleOpen={onToggleApprovalStatusDropdown}
            onToggleValue={onToggleApprovalStatus}
            onToggleAll={onToggleAllApprovalStatus}
          />
        </div>

        <div className={filterRowClass}>
          <span className={inlineLabelClass}>지표</span>
          <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[minmax(7rem,0.9fr)_minmax(0,1fr)_auto_minmax(0,1fr)]">
            <div className="min-w-0 max-sm:col-span-3">
              <Select
                value={draftFilters.metric}
                options={[...DOCTOR_METRIC_OPTIONS]}
                showPlaceholderOption={false}
                onChange={onMetricChange}
                className="h-11 px-3"
              />
            </div>
            <div className="min-w-0">
              <InputField
                type="number"
                min="0"
                value={draftFilters.metricMin}
                onChange={(event) => onMetricMinChange(event.target.value.replace(/\D/g, ""))}
                placeholder="1"
                className="bg-white px-3"
              />
            </div>
            <span className="text-sm text-gray-400">~</span>
            <div className="min-w-0">
              <InputField
                type="number"
                min="0"
                value={draftFilters.metricMax}
                onChange={(event) => onMetricMaxChange(event.target.value.replace(/\D/g, ""))}
                placeholder="500"
                className="bg-white px-3"
              />
            </div>
          </div>
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
                placeholder="DID, 병의원, 의료진, 면허번호 검색"
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
              필터 초기화
            </Button>
            <Can permission="beaulab.doctor.create">
              <Link href="/doctors/new">
                <Button type="button" variant="brand" size="sm" className="h-11 px-5">
                  <SquarePlus className="size-5" />
                  <span>의료진 등록</span>
                </Button>
              </Link>
            </Can>
          </div>
        </div>
      </div>
    </Card>
  );
}
