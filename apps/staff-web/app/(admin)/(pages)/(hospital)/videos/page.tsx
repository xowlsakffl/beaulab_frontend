import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import VideosTableClient from "./VideosTableClient";

export const metadata: Metadata = {
  title: "동영상 관리 | 뷰랩 관리자",
  description: "뷰랩 관리자 동영상 관리 페이지입니다.",
};

export default function VideosPage() {
  return (
    <div className="space-y-6">
        <PageBreadcrumb
            pageTitle="동영상"
            homeLabel="관리자"
            items={[{ label: "동영상 관리" }]}
        />
      <VideosTableClient />
    </div>
  );
}
