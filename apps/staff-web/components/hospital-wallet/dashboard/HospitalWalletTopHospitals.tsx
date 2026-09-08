"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import {
  Card,
  DateRangeFilterDropdown,
  HorizontalGroupedBarChart,
  SegmentedTabs,
  SpinnerBlock,
} from "@beaulab/ui-admin";

import { useHospitalWalletTopHospitals } from "@/hooks/hospital-wallet/useHospitalWalletTopHospitals";
import {
  WALLET_DASHBOARD_BALANCE_TYPES,
  WALLET_DASHBOARD_CHART_COLORS,
  WALLET_DASHBOARD_DATE_PRESETS,
  buildWalletDashboardDateRange,
  formatWalletDashboardCompactPoints,
  formatWalletDashboardPoints,
  mapWalletDashboardDateRange,
  type WalletDashboardBalanceType,
  type WalletDashboardDatePresetKey,
} from "@/lib/hospital-wallet/dashboard";

export function HospitalWalletTopHospitals() {
  const [balanceType, setBalanceType] = React.useState<WalletDashboardBalanceType>("ALL");
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>();
  const [appliedDateRange, setAppliedDateRange] = React.useState<DateRange | undefined>();
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);
  const appliedDates = React.useMemo(() => mapWalletDashboardDateRange(appliedDateRange), [appliedDateRange]);
  const draftDates = React.useMemo(() => mapWalletDashboardDateRange(draftDateRange), [draftDateRange]);
  const { rows, loading, error } = useHospitalWalletTopHospitals({
    balanceType,
    startDate: appliedDates.startDate || undefined,
    endDate: appliedDates.endDate || undefined,
  });

  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!datePickerRef.current?.contains(event.target as Node)) setDatePickerOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const applyPreset = (preset: WalletDashboardDatePresetKey) => {
    const range = buildWalletDashboardDateRange(preset);
    setDraftDateRange(range);
    setAppliedDateRange(range);
    setDatePickerOpen(false);
  };

  return (
    <Card className="min-w-0 rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">충전금 사용 상위 병의원</h2>
          <span className="text-xs text-gray-500">단위: P</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedTabs
            items={WALLET_DASHBOARD_BALANCE_TYPES}
            value={balanceType}
            onValueChange={setBalanceType}
            className="w-[196px] max-sm:w-full"
            tabClassName="h-9 px-3 py-1.5"
          />
          <div className="w-[250px] max-sm:w-full">
            <DateRangeFilterDropdown
              label="기간"
              hideLabel
              value={draftDates.label}
              placeholder="기간 선택"
              selected={draftDateRange}
              isOpen={datePickerOpen}
              containerRef={datePickerRef}
              presetOptions={WALLET_DASHBOARD_DATE_PRESETS}
              onToggleOpen={() => setDatePickerOpen((current) => !current)}
              onSelect={setDraftDateRange}
              onPresetSelect={(preset) => applyPreset(preset as WalletDashboardDatePresetKey)}
              onReset={() => setDraftDateRange(undefined)}
              onConfirm={() => {
                setAppliedDateRange(draftDateRange);
                setDatePickerOpen(false);
              }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <SpinnerBlock className="min-h-[300px]" spinnerClassName="size-8" label="충전금 사용 현황 불러오는 중" />
      ) : error ? (
        <div className="flex min-h-[300px] items-center justify-center text-center text-sm text-gray-500">{error}</div>
      ) : rows.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center text-sm text-gray-400">
          선택한 기간의 소진 내역이 없습니다.
        </div>
      ) : (
        <HorizontalGroupedBarChart
          categories={rows.map((row) => `${row.rank}. ${row.hospitalName}`)}
          series={[{ name: "소진 포인트", data: rows.map((row) => row.usedPoints) }]}
          colors={[WALLET_DASHBOARD_CHART_COLORS[3]]}
          height={320}
          minWidth={720}
          barHeight="28%"
          valueFormatter={formatWalletDashboardPoints}
          axisValueFormatter={formatWalletDashboardCompactPoints}
        />
      )}
    </Card>
  );
}
