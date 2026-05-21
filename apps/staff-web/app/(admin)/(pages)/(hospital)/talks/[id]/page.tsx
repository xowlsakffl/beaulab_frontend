import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import TalkDetailPageClient from "./TalkDetailPageClient";

export const metadata: Metadata = {
  title: "토크 상세 | 뷰랩 관리자",
};

export default function TalkDetailPage() {
  return (
    <div className="space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="토크 상세"
          homeLabel="관리자"
          items={[
            { label: "게시물 관리" },
            { label: "토크", href: "/talks" },
          ]}
        />
      </div>

      <TalkDetailPageClient />
    </div>
  );
}
