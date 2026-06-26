import type { Metadata } from "next";

import VideosCreateFormClient from "./VideosCreateFormClient";

export const metadata: Metadata = {
  title: "동영상 등록 | 뷰랩 관리자",
};

export default function VideosCreatePage() {
  return (
    <div className="space-y-6">
      <VideosCreateFormClient />
    </div>
  );
}
