import type { Metadata } from "next";

import ReportedChatDetailPageClient from "../../ReportedChatDetailPageClient";

export const metadata: Metadata = {
  title: "채팅 신고게시물 상세 | Beaulab Staff",
};

export default function ReportedChatDetailPage() {
  return <ReportedChatDetailPageClient />;
}
