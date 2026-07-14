import type { Metadata } from "next";

import EventAdsCreateFormClient from "./EventAdsCreateFormClient";

export const metadata: Metadata = {
  title: "광고 등록 | 뷰랩 관리자",
};

export default function EventAdCreatePage() {
  return (
    <div className="space-y-6">
      <EventAdsCreateFormClient />
    </div>
  );
}
