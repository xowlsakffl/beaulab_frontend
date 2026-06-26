import type { Metadata } from "next";

import HospitalEventsTableClient from "./HospitalEventsTableClient";

export const metadata: Metadata = {
  title: "이벤트 관리 | 뷰랩 관리자",
};

export default function HospitalEventsPage() {
  return (
    <div className="space-y-6">
      <HospitalEventsTableClient />
    </div>
  );
}
