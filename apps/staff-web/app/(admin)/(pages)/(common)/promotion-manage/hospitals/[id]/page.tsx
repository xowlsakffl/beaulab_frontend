import type { Metadata } from "next";
import HospitalPromotionDetailClient from "@/components/hospital-promotion/detail/HospitalPromotionDetailClient";

export const metadata: Metadata = { title: "병의원 프로모션 | 뷰랩 관리자" };

export default function HospitalPromotionDetailPage() {
  return <HospitalPromotionDetailClient />;
}
