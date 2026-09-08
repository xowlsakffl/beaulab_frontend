"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";

import { api, isApiRequestCanceledError } from "@/lib/common/api";
import {
  normalizeWalletDashboardTopHospitals,
  type WalletDashboardBalanceType,
  type WalletDashboardTopHospital,
  type WalletDashboardTopHospitalsApiData,
} from "@/lib/hospital-wallet/dashboard";

export function useHospitalWalletTopHospitals({
  balanceType,
  startDate,
  endDate,
}: {
  balanceType: WalletDashboardBalanceType;
  startDate?: string;
  endDate?: string;
}) {
  const [rows, setRows] = React.useState<WalletDashboardTopHospital[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
            start_date: startDate,
            end_date: endDate,
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
  }, [balanceType, endDate, startDate]);

  return { rows, loading, error };
}
