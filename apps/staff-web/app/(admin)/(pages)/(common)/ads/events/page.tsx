import type { Metadata } from "next";

import HospitalEventsTableClient from "@/app/(admin)/(pages)/(hospital)/events/HospitalEventsTableClient";

export const metadata: Metadata = {
  title: "이벤트 관리 | 뷰랩 관리자",
};

export default function AdsEventsPage() {
  return (
    <div className="space-y-6">
      <HospitalEventsTableClient />
    </div>
  );
}
