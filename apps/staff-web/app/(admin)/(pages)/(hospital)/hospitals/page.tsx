import type { Metadata } from "next";
import HospitalsTableClient from "./HospitalsTableClient";

export const metadata: Metadata = {
  title: "병의원 | 뷰랩 관리자",
};

export default function HospitalsPage() {
  return (
    <div className="space-y-6">
      <HospitalsTableClient />
    </div>
  );
}
