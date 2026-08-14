import type { Metadata } from "next";

import HospitalWalletHistoryTableClient from "./HospitalWalletHistoryTableClient";

export const metadata: Metadata = {
  title: "충전금 내역 | 뷰랩 관리자",
};

export default function WalletHistoryPage() {
  return <HospitalWalletHistoryTableClient />;
}
