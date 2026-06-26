import type { Metadata } from "next";
import HospitalsCreateFormClient from "./HospitalsCreateFormClient";

export const metadata: Metadata = {
  title: "병의원 등록 | 뷰랩 관리자",
};

export default function HospitalsCreatePage() {
  return (
    <div className="space-y-6">
      <HospitalsCreateFormClient />
    </div>
  );
}
