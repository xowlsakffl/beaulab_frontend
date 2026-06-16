import type { Metadata } from "next";

import TalkDetailPageClient from "./TalkDetailPageClient";

export const metadata: Metadata = {
  title: "토크 상세 | 뷰랩 관리자",
};

export default function TalkDetailPage() {
  return (
    <div className="space-y-6">
      <TalkDetailPageClient />
    </div>
  );
}
