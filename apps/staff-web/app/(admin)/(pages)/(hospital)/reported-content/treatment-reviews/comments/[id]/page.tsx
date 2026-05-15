import type { Metadata } from "next";

import ReportedContentCommentDetailPageClient from "../../../ReportedContentCommentDetailPageClient";

export const metadata: Metadata = {
  title: "시술후기 댓글 신고게시물 상세 | Beaulab Staff",
};

export default function ReportedTreatmentReviewCommentDetailPage() {
  return <ReportedContentCommentDetailPageClient type="treatment-review-comments" />;
}
