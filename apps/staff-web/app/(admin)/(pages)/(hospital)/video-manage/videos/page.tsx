import type { Metadata } from "next";

import VideosTableClient from "./VideosTableClient";

export const metadata: Metadata = {
  title: "동영상 관리 | 뷰랩 관리자",
};

export default function VideosPage() {
  return (
    <div className="space-y-6">
      <VideosTableClient />
    </div>
  );
}
