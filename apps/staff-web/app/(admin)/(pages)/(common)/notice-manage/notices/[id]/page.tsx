import type { Metadata } from "next";

import NoticeDetailPageClient from "./NoticeDetailPageClient";

export const metadata: Metadata = {
  title: "공지사항 상세 | 뷰랩 관리자",
};

export default function NoticeDetailPage() {
  return (
    <div className="space-y-6">
      <NoticeDetailPageClient />
    </div>
  );
}
