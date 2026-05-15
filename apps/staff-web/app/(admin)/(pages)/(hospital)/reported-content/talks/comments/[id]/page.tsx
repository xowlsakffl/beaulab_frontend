import type { Metadata } from "next";

import ReportedContentCommentDetailPageClient from "../../../ReportedContentCommentDetailPageClient";

export const metadata: Metadata = {
  title: "토크 댓글 신고게시물 상세 | Beaulab Staff",
};

export default function ReportedTalkCommentDetailPage() {
  return <ReportedContentCommentDetailPageClient type="talk-comments" />;
}
