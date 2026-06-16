import type { Metadata } from "next";

import HospitalDetailPageClient from "./HospitalDetailPageClient";

export const metadata: Metadata = {
  title: "병의원 상세 | 뷰랩 관리자",
};

export default function HospitalDetailPage() {
  return (
    <div className="space-y-6">
      <HospitalDetailPageClient />
    </div>
  );
}
