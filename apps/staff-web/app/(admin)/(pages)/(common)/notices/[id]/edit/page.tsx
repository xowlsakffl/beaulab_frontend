import type { Metadata } from "next";

import NoticeEditFormClient from "./NoticeEditFormClient";

export const metadata: Metadata = {
  title: "공지사항 수정 | 뷰랩 관리자",
};

export default function NoticeEditPage() {
  return (
    <div className="space-y-6">
      <NoticeEditFormClient />
    </div>
  );
}
