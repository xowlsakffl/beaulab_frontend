import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import VideoDetailPageClient from "./VideoDetailPageClient";

export const metadata: Metadata = {
  title: "동영상 상세 | 뷰랩 관리자",
  description: "뷰랩 관리자 동영상 상세 페이지입니다.",
};

export default function VideoDetailPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="동영상 상세"
        homeLabel="관리자"
        items={[
          { label: "동영상 관리" },
          { label: "동영상", href: "/videos" },
        ]}
      />
      <VideoDetailPageClient />
    </div>
  );
}
