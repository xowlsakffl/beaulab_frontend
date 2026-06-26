import type { Metadata } from "next";

import ReportedContentDetailPageClient from "../../ReportedContentDetailPageClient";

export const metadata: Metadata = {
  title: "병의원 평가 신고게시물 상세 | Beaulab Staff",
};

export default function ReportedHospitalEvaluationDetailPage() {
  return <ReportedContentDetailPageClient type="hospital-evaluations" />;
}
