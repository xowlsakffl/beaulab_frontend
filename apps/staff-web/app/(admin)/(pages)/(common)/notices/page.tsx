import type { Metadata } from "next";

import NoticesTableClient from "./NoticesTableClient";

export const metadata: Metadata = {
  title: "공지사항 | 뷰랩 관리자",
};

export default function NoticesPage() {
  return (
    <div className="space-y-6">
      <NoticesTableClient />
    </div>
  );
}
