import { formatWalletDashboardPoints, type WalletDashboardOverview } from "@/lib/hospital-wallet/dashboard";

type HospitalWalletDashboardSummaryProps = {
  overview: WalletDashboardOverview;
};

export function HospitalWalletDashboardSummary({ overview }: HospitalWalletDashboardSummaryProps) {
  const summaryItems = [
    {
      label: `${overview.year}년도 입금액`,
      value: overview.annual.chargedPoints,
    },
    {
      label: `${overview.year}년도 사용액`,
      value: overview.annual.usedPoints,
    },
    {
      label: `${overview.year}년도 환불액`,
      value: overview.annual.refundedPoints,
    },
  ];

  return (
    <section className="grid gap-px overflow-hidden rounded-xl bg-gray-200 ring-1 ring-gray-200 md:grid-cols-2 xl:grid-cols-4">
      {summaryItems.map((item) => (
        <div key={item.label} className="flex min-h-28 flex-col justify-center bg-white px-6 py-5">
          <span className="text-sm font-medium text-gray-600">{item.label}</span>
          <strong className="mt-3 text-2xl font-semibold text-gray-900">
            {formatWalletDashboardPoints(item.value)}
          </strong>
        </div>
      ))}

      <div className="flex min-h-28 flex-col justify-center bg-white px-6 py-5">
        <span className="text-sm font-medium text-gray-600">총 잔여 포인트</span>
        <strong className="mt-3 text-2xl font-semibold text-gray-900">
          {formatWalletDashboardPoints(overview.balances.totalPoints)}
        </strong>
        <div className="mt-2 flex flex-col items-start gap-1 text-xs text-gray-500">
          <span>충전(유상) {formatWalletDashboardPoints(overview.balances.paidPoints)}</span>
          <span>서비스(무상) {formatWalletDashboardPoints(overview.balances.servicePoints)}</span>
        </div>
      </div>
    </section>
  );
}
