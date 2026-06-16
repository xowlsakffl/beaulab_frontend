import type { Metadata } from "next";

import DoctorDetailPageClient from "./DoctorDetailPageClient";

export const metadata: Metadata = {
  title: "의료진 상세 | 뷰랩 관리자",
};

export default function DoctorDetailPage() {
  return (
    <div className="space-y-6">
      <DoctorDetailPageClient />
    </div>
  );
}
