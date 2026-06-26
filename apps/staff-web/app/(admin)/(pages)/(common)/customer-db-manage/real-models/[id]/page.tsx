import type { Metadata } from "next";

import HospitalEventRealModelDBDetailPageClient from "./HospitalEventRealModelDBDetailPageClient";

export const metadata: Metadata = {
  title: "리얼모델 DB 상세 | 뷰랩 관리자",
};

export default function HospitalEventRealModelDBDetailPage() {
  return (
    <div className="min-w-0 space-y-6">
      <HospitalEventRealModelDBDetailPageClient />
    </div>
  );
}
