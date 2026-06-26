import type { Metadata } from "next";

import DoctorsTableClient from "./DoctorsTableClient";

export const metadata: Metadata = {
  title: "의료진 | 뷰랩 관리자",
};

export default function DoctorsPage() {
  return (
    <div className="space-y-6">
      <DoctorsTableClient />
    </div>
  );
}
