import type { Metadata } from "next";
import HospitalPromotionFormClient from "@/components/hospital-promotion/form/HospitalPromotionFormClient";

export const metadata: Metadata = { title: "병의원 프로모션 등록 | 뷰랩 관리자" };

export default function HospitalPromotionCreatePage() {
  return <HospitalPromotionFormClient />;
}
