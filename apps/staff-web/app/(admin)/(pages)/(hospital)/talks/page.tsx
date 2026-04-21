import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import TalksTableClient from "./TalksTableClient";

export const metadata: Metadata = {
  title: "토크 | 뷰랩 관리자",
  description: "뷰랩 관리자 토크 페이지입니다.",
};

export default function TalksPage() {
  return (
    <div className="min-w-0 space-y-6">
      <PageBreadcrumb
        pageTitle="토크"
        homeLabel="관리자"
        items={[{ label: "게시물 관리" }]}
      />
      <TalksTableClient />
    </div>
  );
}
