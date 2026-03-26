import type { Metadata } from "next";
import { PageBreadcrumb } from "@beaulab/ui-admin";

import NoticesCreateFormClient from "./NoticesCreateFormClient";

export const metadata: Metadata = {
  title: "공지사항 등록 | 뷰랩 관리자",
  description: "뷰랩 관리자 공지사항 등록 페이지입니다.",
};

export default function NoticesCreatePage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="공지사항 등록"
        homeLabel="관리자"
        items={[
          { label: "공지사항 관리" },
          { label: "공지사항", href: "/notices" },
        ]}
      />

      <NoticesCreateFormClient />
    </div>
  );
}
