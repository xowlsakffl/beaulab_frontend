import type { Metadata } from "next";

import HospitalEvaluationDetailPageClient from "../HospitalEvaluationDetailPageClient";

export const metadata: Metadata = {
  title: "병의원 평가 상세 | 뷰랩 관리자",
};

export default function HospitalEvaluationDetailPage() {
  return (
    <div className="min-w-0 space-y-6">
      <HospitalEvaluationDetailPageClient />
    </div>
  );
}
