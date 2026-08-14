import { BanknoteArrowDown, Coins, ReceiptText, WalletCards } from "@beaulab/ui-admin";

import { formatWalletDashboardPoints, type WalletDashboardOverview } from "@/lib/hospital-wallet/dashboard";

type HospitalWalletDashboardSummaryProps = {
  overview: WalletDashboardOverview;
};

export function HospitalWalletDashboardSummary({ overview }: HospitalWalletDashboardSummaryProps) {
  const summaryItems = [
    {
      label: `${overview.year}년도 입금액`,
      value: overview.annual.chargedPoints,
      icon: WalletCards,
    },
    {
      label: `${overview.year}년도 사용액`,
      value: overview.annual.usedPoints,
      icon: ReceiptText,
    },
    {
      label: `${overview.year}년도 환불액`,
      value: overview.annual.refundedPoints,
      icon: BanknoteArrowDown,
    },
  ];

  return (
    <section className="grid gap-px overflow-hidden rounded-xl bg-gray-200 ring-1 ring-gray-200 md:grid-cols-2 xl:grid-cols-4">
      {summaryItems.map((item) => (
        <div key={item.label} className="flex min-h-36 flex-col justify-between bg-white px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-600">{item.label}</p>
            <span className="flex size-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
              <item.icon className="size-[18px]" strokeWidth={1.8} />
            </span>
          </div>
          <p className="mt-5 text-2xl font-semibold text-gray-900">{formatWalletDashboardPoints(item.value)}</p>
        </div>
      ))}

      <div className="flex min-h-36 flex-col justify-between bg-white px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-gray-600">총 잔여 포인트</span>
          <span className="flex size-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
            <Coins className="size-[18px]" strokeWidth={1.8} />
          </span>
        </div>
        <strong className="mt-3 text-xl font-semibold text-gray-900">
          {formatWalletDashboardPoints(overview.balances.totalPoints)}
        </strong>
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
          <div className="flex min-w-0 items-center gap-1.5">
            <span>충전(유상)</span>
            <span className="font-semibold text-gray-800">
              {formatWalletDashboardPoints(overview.balances.paidPoints)}
            </span>
          </div>
          <span className="h-3 w-px bg-gray-300" />
          <div className="flex min-w-0 items-center gap-1.5">
            <span>서비스(무상)</span>
            <span className="font-semibold text-gray-800">
              {formatWalletDashboardPoints(overview.balances.servicePoints)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
