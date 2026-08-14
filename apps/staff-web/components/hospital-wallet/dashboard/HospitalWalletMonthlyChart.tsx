import { Card, DoubleBarChart } from "@beaulab/ui-admin";

import {
  WALLET_DASHBOARD_CHART_COLORS,
  formatWalletDashboardCompactPoints,
  formatWalletDashboardPoints,
  type WalletDashboardMonthlyItem,
} from "@/lib/hospital-wallet/dashboard";

type HospitalWalletMonthlyChartProps = {
  items: WalletDashboardMonthlyItem[];
};

const MONTHLY_CHART_COLORS = WALLET_DASHBOARD_CHART_COLORS.slice(0, 5);

export function HospitalWalletMonthlyChart({ items }: HospitalWalletMonthlyChartProps) {
  const series = [
    { name: "서비스 적립", data: items.map((item) => item.serviceGrantedPoints) },
    { name: "서비스 회수", data: items.map((item) => item.serviceReclaimedPoints) },
    { name: "충전", data: items.map((item) => item.chargedPoints) },
    { name: "소진", data: items.map((item) => item.usedPoints) },
    { name: "환불", data: items.map((item) => item.refundedPoints) },
  ];
  const maximumPoints = Math.max(0, ...series.flatMap((item) => item.data));
  const yAxisStepSize = maximumPoints >= 10_000_000 && maximumPoints < 100_000_000 ? 5_000_000 : undefined;

  return (
    <Card className="rounded-xl p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-gray-900">월별 충전금 추이</h2>
        <span className="text-xs text-gray-500">단위: P</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {series.map((item, index) => (
          <span key={item.name} className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: MONTHLY_CHART_COLORS[index] }} />
            {item.name}
          </span>
        ))}
      </div>
      <DoubleBarChart
        categories={items.map((item) => item.month.slice(2))}
        series={series}
        colors={MONTHLY_CHART_COLORS}
        height={360}
        minWidth={760}
        yAxisStepSize={yAxisStepSize}
        valueFormatter={formatWalletDashboardPoints}
        axisValueFormatter={formatWalletDashboardCompactPoints}
      />
    </Card>
  );
}
