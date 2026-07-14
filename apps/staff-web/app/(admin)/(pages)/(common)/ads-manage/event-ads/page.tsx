import type { Metadata } from "next";

import EventAdsTableClient from "./EventAdsTableClient";

export const metadata: Metadata = {
  title: "이벤트 광고 | 뷰랩 관리자",
};

export default function EventAdsPage() {
  return (
    <div className="space-y-6">
      <EventAdsTableClient />
    </div>
  );
}
