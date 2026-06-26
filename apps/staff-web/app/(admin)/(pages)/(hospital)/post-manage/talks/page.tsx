import type { Metadata } from "next";

import TalksTableClient from "./TalksTableClient";

export const metadata: Metadata = {
  title: "토크 | 뷰랩 관리자",
};

export default function TalksPage() {
  return (
    <div className="min-w-0 space-y-6">
      <TalksTableClient />
    </div>
  );
}
