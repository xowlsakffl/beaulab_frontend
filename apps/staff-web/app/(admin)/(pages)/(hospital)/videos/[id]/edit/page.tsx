import type { Metadata } from "next";

import VideoEditFormClient from "./VideoEditFormClient";

export const metadata: Metadata = {
  title: "동영상 수정 | 뷰랩 관리자",
};

export default function VideoEditPage() {
  return (
    <div className="space-y-6">
      <VideoEditFormClient />
    </div>
  );
}
