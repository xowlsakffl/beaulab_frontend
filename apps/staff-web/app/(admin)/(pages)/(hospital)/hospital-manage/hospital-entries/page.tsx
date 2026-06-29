import type { Metadata } from "next";

import HospitalEntriesTableClient from "./HospitalEntriesTableClient";

export const metadata: Metadata = {
  title: "입점신청 | 뷰랩 관리자",
};

export default function HospitalEntriesPage() {
  return (
    <div className="space-y-6">
      <HospitalEntriesTableClient />
    </div>
  );
}
