import type { Metadata } from "next";

import DoctorsCreateFormClient from "./DoctorsCreateFormClient";

export const metadata: Metadata = {
  title: "의료진 등록 | 뷰랩 관리자",
};

export default function DoctorsCreatePage() {
  return (
    <div className="space-y-6">
      <DoctorsCreateFormClient />
    </div>
  );
}
