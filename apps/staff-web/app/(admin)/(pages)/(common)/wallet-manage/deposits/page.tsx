import type { Metadata } from "next";

import HospitalWalletDashboardClient from "./HospitalWalletDashboardClient";

export const metadata: Metadata = {
  title: "충전금 현황 | 뷰랩 관리자",
};

export default function WalletDepositsPage() {
  return <HospitalWalletDashboardClient />;
}
