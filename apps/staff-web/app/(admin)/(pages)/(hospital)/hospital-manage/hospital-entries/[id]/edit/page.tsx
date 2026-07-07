import type { Metadata } from "next";

import HospitalEntryEditFormClient from "./HospitalEntryEditFormClient";

export const metadata: Metadata = {
  title: "입점신청 수정 | 뷰랩 관리자",
};

export default function HospitalEntryEditPage() {
  return (
    <div className="space-y-6">
      <HospitalEntryEditFormClient />
    </div>
  );
}
