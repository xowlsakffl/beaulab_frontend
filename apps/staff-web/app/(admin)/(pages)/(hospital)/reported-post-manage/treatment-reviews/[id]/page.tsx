import type { Metadata } from "next";

import ReportedContentDetailPageClient from "../../ReportedContentDetailPageClient";

export const metadata: Metadata = {
  title: "시술후기 신고게시물 상세 | Beaulab Staff",
};

export default function ReportedTreatmentReviewDetailPage() {
  return <ReportedContentDetailPageClient type="treatment-reviews" />;
}
