import type { Metadata } from "next";

import NoticesCreateFormClient from "./NoticesCreateFormClient";

export const metadata: Metadata = {
  title: "공지사항 등록 | 뷰랩 관리자",
};

export default function NoticesCreatePage() {
  return (
    <div className="space-y-6">
      <NoticesCreateFormClient />
    </div>
  );
}
