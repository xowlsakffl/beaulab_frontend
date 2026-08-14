import { BarChartOne, Card } from "@beaulab/ui-admin";

import {
  formatWalletDashboardCompactPoints,
  formatWalletDashboardPoints,
  type WalletDashboardMonthlyItem,
} from "@/lib/hospital-wallet/dashboard";

type HospitalWalletMonthlyChartProps = {
  items: WalletDashboardMonthlyItem[];
};

export function HospitalWalletMonthlyChart({ items }: HospitalWalletMonthlyChartProps) {
  return (
    <Card className="rounded-xl p-5">
      <div className="mb-2 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-gray-900">월별 충전금 추이</h2>
        <span className="text-xs text-gray-500">단위: P</span>
      </div>
      <BarChartOne
        categories={items.map((item) => item.month.slice(2))}
        series={[
          { name: "서비스 적립", data: items.map((item) => item.serviceGrantedPoints) },
          { name: "서비스 회수", data: items.map((item) => item.serviceReclaimedPoints) },
          { name: "충전", data: items.map((item) => item.chargedPoints) },
          { name: "소진", data: items.map((item) => item.usedPoints) },
          { name: "환불", data: items.map((item) => item.refundedPoints) },
        ]}
        colors={["#7F9CF5", "#F3B66F", "#70BFA1", "#EE8D87", "#A58BE2"]}
        height={350}
        minWidth={860}
        valueFormatter={formatWalletDashboardPoints}
        axisValueFormatter={formatWalletDashboardCompactPoints}
      />
    </Card>
  );
}
