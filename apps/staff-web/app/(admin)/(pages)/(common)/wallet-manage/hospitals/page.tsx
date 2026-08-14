import type { Metadata } from "next";

import HospitalWalletsTableClient from "./HospitalWalletsTableClient";

export const metadata: Metadata = {
  title: "병의원 충전금 관리 | 뷰랩 관리자",
};

export default function HospitalWalletsPage() {
  return (
    <div className="space-y-6">
      <HospitalWalletsTableClient />
    </div>
  );
}
