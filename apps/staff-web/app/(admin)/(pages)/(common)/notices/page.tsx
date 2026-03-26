import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import NoticesTableClient from "./NoticesTableClient";

export const metadata: Metadata = {
  title: "공지사항 | 뷰랩 관리자",
  description: "뷰랩 관리자 공지사항 페이지입니다.",
};

export default function NoticesPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="공지사항"
        homeLabel="관리자"
        items={[{ label: "공지사항 관리" }]}
      />
      <NoticesTableClient />
    </div>
  );
}
