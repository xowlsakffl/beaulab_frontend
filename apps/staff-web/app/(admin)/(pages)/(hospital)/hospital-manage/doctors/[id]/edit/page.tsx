import type { Metadata } from "next";

import DoctorEditFormClient from "./DoctorEditFormClient";

export const metadata: Metadata = {
  title: "의료진 수정 | 뷰랩 관리자",
};

export default function DoctorEditPage() {
  return (
    <div className="space-y-6">
      <DoctorEditFormClient />
    </div>
  );
}
