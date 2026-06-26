import type { Metadata } from "next";

import HashtagsPageClient from "./HashtagsPageClient";

export const metadata: Metadata = {
  title: "해시태그 | 뷰랩 관리자",
};

export default function HashtagsPage() {
  return (
    <div className="space-y-6">
      <HashtagsPageClient />
    </div>
  );
}
