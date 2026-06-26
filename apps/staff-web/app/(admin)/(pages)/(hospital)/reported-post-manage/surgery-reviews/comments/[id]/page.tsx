import type { Metadata } from "next";

import ReportedContentCommentDetailPageClient from "../../../ReportedContentCommentDetailPageClient";

export const metadata: Metadata = {
  title: "성형후기 댓글 신고게시물 상세 | Beaulab Staff",
};

export default function ReportedSurgeryReviewCommentDetailPage() {
  return <ReportedContentCommentDetailPageClient type="surgery-review-comments" />;
}
