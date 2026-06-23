import type { Metadata } from "next";

import HospitalEntryDetailPageClient from "./HospitalEntryDetailPageClient";

export const metadata: Metadata = {
  title: "입점신청 상세 | 뷰랩 관리자",
};

export default function HospitalEntryDetailPage() {
  return <HospitalEntryDetailPageClient />;
}
