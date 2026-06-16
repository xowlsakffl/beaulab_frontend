import type { Metadata } from "next";

import HospitalReviewDetailPageClient from "../../HospitalReviewDetailPageClient";

export const metadata: Metadata = {
  title: "성형후기 상세 | 뷰랩 관리자",
};

export default function SurgeryReviewDetailPage() {
  return (
    <div className="min-w-0 space-y-6">
      <HospitalReviewDetailPageClient type="surgery" />
    </div>
  );
}
