"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import { Button, Card, CheckboxFilterDropdown, DateRangeFilterDropdown, InputField } from "@beaulab/ui-admin";

import {
  CHARGE_STATUS_OPTIONS,
  WALLET_OPERATION_DATE_PRESETS,
  type WalletOperationDatePresetKey,
  type WalletOperationFilters,
  type WalletOperationStatus,
  type WalletOperationTypeGroup,
} from "@/lib/hospital-wallet/history";

type HospitalWalletHistoryFilterPanelProps = {
  tab: WalletOperationTypeGroup;
  searchInput: string;
  draftFilters: WalletOperationFilters;
  draftDateRange?: DateRange;
  datePickerOpen: boolean;
  statusDropdownOpen: boolean;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  statusDropdownRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onToggleDatePicker: () => void;
  onToggleStatusDropdown: () => void;
  onToggleStatus: (value: WalletOperationStatus) => void;
  onToggleAllStatuses: () => void;
  onApplyDateRange: (range?: DateRange) => void;
  onApplyDatePreset: (preset: WalletOperationDatePresetKey) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function HospitalWalletHistoryFilterPanel({
  tab,
  searchInput,
  draftFilters,
  draftDateRange,
  datePickerOpen,
  statusDropdownOpen,
  datePickerRef,
  statusDropdownRef,
  onSearchChange,
  onToggleDatePicker,
  onToggleStatusDropdown,
  onToggleStatus,
  onToggleAllStatuses,
  onApplyDateRange,
  onApplyDatePreset,
  onApplyFilters,
  onResetFilters,
}: HospitalWalletHistoryFilterPanelProps) {
  const filterRowClass = "flex min-w-0 items-center gap-2 py-1.5";
  const labelClass = "w-16 shrink-0 text-right text-sm font-medium whitespace-nowrap text-gray-600";

  return (
    <Card className="min-w-0 rounded-xl p-3">
      <div className="flex min-w-0 items-center gap-3 max-xl:flex-wrap">
        <div className={`${filterRowClass} w-[360px] max-xl:w-full`}>
          <span className={labelClass}>거래일</span>
          <div className="min-w-0 flex-1">
            <DateRangeFilterDropdown
              label="거래일"
              hideLabel
              containerRef={datePickerRef}
              value={draftFilters.dateRange}
              placeholder="거래일 선택"
              selected={draftDateRange}
              isOpen={datePickerOpen}
              presetOptions={WALLET_OPERATION_DATE_PRESETS}
              onToggleOpen={onToggleDatePicker}
              onSelect={onApplyDateRange}
              onPresetSelect={(value) => onApplyDatePreset(value as WalletOperationDatePresetKey)}
              onReset={() => onApplyDateRange(undefined)}
              onConfirm={onToggleDatePicker}
            />
          </div>
        </div>

        {tab === "CHARGE" ? (
          <div className={`${filterRowClass} w-[290px] max-xl:w-full`}>
            <span className={labelClass}>입금상태</span>
            <div className="min-w-0 flex-1">
              <CheckboxFilterDropdown
                label="입금상태"
                hideLabel
                containerRef={statusDropdownRef}
                selectedValues={draftFilters.statuses}
                options={CHARGE_STATUS_OPTIONS}
                isOpen={statusDropdownOpen}
                onToggleOpen={onToggleStatusDropdown}
                onToggleValue={(value) => onToggleStatus(value as WalletOperationStatus)}
                onToggleAll={onToggleAllStatuses}
              />
            </div>
          </div>
        ) : null}

        <div className={`${filterRowClass} min-w-[360px] flex-1 max-xl:w-full`}>
          <span className={labelClass}>검색</span>
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
              placeholder="병의원, 담당자를 입력해 주세요."
              className="bg-white"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="brand" size="filter" onClick={onApplyFilters}>
            검색
          </Button>
          <Button type="button" variant="brandOutline" size="filter" onClick={onResetFilters}>
            검색 초기화
          </Button>
        </div>
      </div>
    </Card>
  );
}
