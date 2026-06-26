import type { Metadata } from "next";

import HospitalEditFormClient from "./HospitalEditFormClient";

export const metadata: Metadata = {
  title: "병의원 수정 | 뷰랩 관리자",
};

export default function HospitalEditPage() {
  return (
    <div className="space-y-6">
      <HospitalEditFormClient />
    </div>
  );
}
