import type { Metadata } from "next";

import AccountUserDetailPageClient from "./AccountUserDetailPageClient";

export const metadata: Metadata = {
  title: "일반회원 상세 | 뷰랩 관리자",
};

export default function AccountUserDetailPage() {
  return (
    <div className="min-w-0 space-y-6">
      <AccountUserDetailPageClient />
    </div>
  );
}
