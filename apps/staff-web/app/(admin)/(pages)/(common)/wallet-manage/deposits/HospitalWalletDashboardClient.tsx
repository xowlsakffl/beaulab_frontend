"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import { SpinnerBlock } from "@beaulab/ui-admin";

import { LoadErrorState } from "@/components/common/LoadErrorState";
import { HospitalWalletCategoryCharts } from "@/components/hospital-wallet/dashboard/HospitalWalletCategoryCharts";
import { HospitalWalletDashboardSummary } from "@/components/hospital-wallet/dashboard/HospitalWalletDashboardSummary";
import { HospitalWalletMonthlyChart } from "@/components/hospital-wallet/dashboard/HospitalWalletMonthlyChart";
import { HospitalWalletTopHospitals } from "@/components/hospital-wallet/dashboard/HospitalWalletTopHospitals";
import { api, isApiRequestCanceledError } from "@/lib/common/api";
import {
  normalizeWalletDashboardOverview,
  type WalletDashboardOverview,
  type WalletDashboardOverviewApiData,
} from "@/lib/hospital-wallet/dashboard";

export default function HospitalWalletDashboardClient() {
  const [overview, setOverview] = React.useState<WalletDashboardOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    const fetchOverview = async () => {
      try {
        const response = await api.get<WalletDashboardOverviewApiData>(
          "/hospital-wallets/dashboard",
          { year: new Date().getFullYear() },
          { latestKey: "hospital-wallet-dashboard:overview" },
        );

        if (!isApiSuccess(response)) {
          throw new Error(response.error.message || "충전금 현황을 불러오지 못했습니다.");
        }

        if (active) setOverview(normalizeWalletDashboardOverview(response.data));
      } catch (requestError) {
        if (!active || isApiRequestCanceledError(requestError)) return;
        setError(requestError instanceof Error ? requestError.message : "충전금 현황 조회 중 오류가 발생했습니다.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchOverview();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-w-0 space-y-4">
      {loading ? (
        <SpinnerBlock className="min-h-[640px]" spinnerClassName="size-10" label="충전금 현황 불러오는 중" />
      ) : error || !overview ? (
        <LoadErrorState title="충전금 현황을 불러오지 못했습니다." message={error} />
      ) : (
        <>
          <HospitalWalletDashboardSummary overview={overview} />
          <HospitalWalletMonthlyChart items={overview.monthly} />
          <HospitalWalletCategoryCharts
            surgery={overview.categoryShares.surgery}
            treatment={overview.categoryShares.treatment}
          />
        </>
      )}
      <HospitalWalletTopHospitals />
    </div>
  );
}
