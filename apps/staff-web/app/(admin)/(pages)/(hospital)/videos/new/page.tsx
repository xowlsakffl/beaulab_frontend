import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import VideosCreateFormClient from "./VideosCreateFormClient";

export const metadata: Metadata = {
  title: "동영상 등록 | 뷰랩 관리자",
  description: "뷰랩 관리자 동영상 등록 페이지입니다.",
};

export default function VideosCreatePage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="동영상 등록"
        homeLabel="관리자"
        items={[
          { label: "동영상 관리" },
          { label: "동영상", href: "/videos" },
        ]}
      />
      <VideosCreateFormClient />
    </div>
  );
}
