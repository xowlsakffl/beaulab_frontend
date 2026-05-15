import type { Metadata } from "next";

import ReportedContentDetailPageClient from "../../ReportedContentDetailPageClient";

export const metadata: Metadata = {
  title: "성형후기 신고게시물 상세 | Beaulab Staff",
};

export default function ReportedSurgeryReviewDetailPage() {
  return <ReportedContentDetailPageClient type="surgery-reviews" />;
}
