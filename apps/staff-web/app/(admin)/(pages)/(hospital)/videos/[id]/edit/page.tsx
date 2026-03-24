import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import VideoEditFormClient from "./VideoEditFormClient";

export const metadata: Metadata = {
  title: "동영상 수정 | 뷰랩 관리자",
  description: "뷰랩 관리자 동영상 수정 페이지입니다.",
};

export default function VideoEditPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="동영상 수정"
        homeLabel="관리자"
        items={[
          { label: "동영상 관리" },
          { label: "동영상", href: "/videos" },
        ]}
      />
      <VideoEditFormClient />
    </div>
  );
}
