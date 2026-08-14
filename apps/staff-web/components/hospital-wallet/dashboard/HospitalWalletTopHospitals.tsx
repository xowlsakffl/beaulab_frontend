"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import { isApiSuccess } from "@beaulab/types";
import { Button, Card, DateRangeFilterDropdown, HorizontalGroupedBarChart, SpinnerBlock } from "@beaulab/ui-admin";

import { api, isApiRequestCanceledError } from "@/lib/common/api";
import {
  WALLET_DASHBOARD_BALANCE_TYPES,
  WALLET_DASHBOARD_CHART_COLORS,
  WALLET_DASHBOARD_DATE_PRESETS,
  buildWalletDashboardDateRange,
  formatWalletDashboardCompactPoints,
  formatWalletDashboardPoints,
  mapWalletDashboardDateRange,
  normalizeWalletDashboardTopHospitals,
  type WalletDashboardBalanceType,
  type WalletDashboardDatePresetKey,
  type WalletDashboardTopHospital,
  type WalletDashboardTopHospitalsApiData,
} from "@/lib/hospital-wallet/dashboard";

export function HospitalWalletTopHospitals() {
  const [balanceType, setBalanceType] = React.useState<WalletDashboardBalanceType>("ALL");
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>();
  const [appliedDateRange, setAppliedDateRange] = React.useState<DateRange | undefined>();
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const [rows, setRows] = React.useState<WalletDashboardTopHospital[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);
  const appliedDates = React.useMemo(() => mapWalletDashboardDateRange(appliedDateRange), [appliedDateRange]);
  const draftDates = React.useMemo(() => mapWalletDashboardDateRange(draftDateRange), [draftDateRange]);

  React.useEffect(() => {
    let active = true;

    const fetchRows = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<WalletDashboardTopHospitalsApiData>(
          "/hospital-wallets/dashboard/top-hospitals",
          {
            balance_type: balanceType,
            start_date: appliedDates.startDate || undefined,
            end_date: appliedDates.endDate || undefined,
          },
          { latestKey: "hospital-wallet-dashboard:top-hospitals" },
        );

        if (!isApiSuccess(response)) {
          throw new Error(response.error.message || "충전금 사용 상위 병의원을 불러오지 못했습니다.");
        }

        if (active) setRows(normalizeWalletDashboardTopHospitals(response.data));
      } catch (requestError) {
        if (!active || isApiRequestCanceledError(requestError)) return;
        setError(
          requestError instanceof Error ? requestError.message : "충전금 사용 현황 조회 중 오류가 발생했습니다.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchRows();

    return () => {
      active = false;
    };
  }, [appliedDates.endDate, appliedDates.startDate, balanceType]);

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
          <div className="flex items-center gap-1">
            {WALLET_DASHBOARD_BALANCE_TYPES.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={balanceType === item.value ? "brand" : "outline"}
                size="sm"
                className="h-9 min-w-14"
                onClick={() => setBalanceType(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
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
