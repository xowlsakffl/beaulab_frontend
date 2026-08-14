import { Card, PieChartOne } from "@beaulab/ui-admin";

import { WALLET_DASHBOARD_CHART_COLORS, type WalletDashboardCategoryShare } from "@/lib/hospital-wallet/dashboard";

type CategoryShareCardProps = {
  title: string;
  items: WalletDashboardCategoryShare[];
};

function CategoryShareCard({ title, items }: CategoryShareCardProps) {
  return (
    <Card className="min-w-0 rounded-xl p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <span className="text-xs text-gray-500">단위: 건</span>
      </div>
      <PieChartOne
        labels={items.map((item) => item.categoryName)}
        series={items.map((item) => item.applicationCount)}
        colors={WALLET_DASHBOARD_CHART_COLORS}
        totalLabel="신청 건수"
        valueFormatter={(value) => `${Math.trunc(value).toLocaleString("ko-KR")}건`}
      />
    </Card>
  );
}

type HospitalWalletCategoryChartsProps = {
  surgery: WalletDashboardCategoryShare[];
  treatment: WalletDashboardCategoryShare[];
};

export function HospitalWalletCategoryCharts({ surgery, treatment }: HospitalWalletCategoryChartsProps) {
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <CategoryShareCard title="성형DB 부위별 비율" items={surgery} />
      <CategoryShareCard title="시술DB 부위별 비율" items={treatment} />
    </div>
  );
}
