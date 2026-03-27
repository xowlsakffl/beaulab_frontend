import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import HashtagsPageClient from "./HashtagsPageClient";

export const metadata: Metadata = {
  title: "해시태그 | 뷰랩 관리자",
  description: "뷰랩 관리자 해시태그 페이지입니다.",
};

export default function HashtagsPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="해시태그"
        homeLabel="관리자"
        items={[{ label: "카테고리 / 해시태그 관리" }]}
      />
      <HashtagsPageClient />
    </div>
  );
}
