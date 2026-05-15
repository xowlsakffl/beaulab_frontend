import type { Metadata } from "next";

import ReportedContentDetailPageClient from "../../ReportedContentDetailPageClient";

export const metadata: Metadata = {
  title: "토크 신고게시물 상세 | Beaulab Staff",
};

export default function ReportedTalkDetailPage() {
  return <ReportedContentDetailPageClient type="talks" />;
}
