import type { Metadata } from "next";

import EventAdDetailPageClient from "./EventAdDetailPageClient";

export const metadata: Metadata = {
  title: "광고 상세 | 뷰랩 관리자",
};

export default function EventAdDetailPage() {
  return (
    <div className="space-y-6">
      <EventAdDetailPageClient />
    </div>
  );
}
