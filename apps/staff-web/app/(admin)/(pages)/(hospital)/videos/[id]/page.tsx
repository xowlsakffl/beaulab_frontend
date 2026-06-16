import type { Metadata } from "next";

import VideoDetailPageClient from "./VideoDetailPageClient";

export const metadata: Metadata = {
  title: "동영상 상세 | 뷰랩 관리자",
};

export default function VideoDetailPage() {
  return (
    <div className="space-y-6">
      <VideoDetailPageClient />
    </div>
  );
}
