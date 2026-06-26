import type { Metadata } from "next";

import HospitalEventDetailPageClient from "./HospitalEventDetailPageClient";

export const metadata: Metadata = {
  title: "이벤트 상세 | 뷰랩 관리자",
};

export default function HospitalEventDetailPage() {
  return (
    <div className="space-y-6">
      <HospitalEventDetailPageClient />
    </div>
  );
}
