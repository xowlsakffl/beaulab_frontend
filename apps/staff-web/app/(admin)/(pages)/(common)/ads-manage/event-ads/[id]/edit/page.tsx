import type { Metadata } from "next";

import EventAdEditPageClient from "./EventAdEditPageClient";

export const metadata: Metadata = {
  title: "광고 수정 | 뷰랩 관리자",
};

export default function EventAdEditPage() {
  return (
    <div className="space-y-6">
      <EventAdEditPageClient />
    </div>
  );
}
