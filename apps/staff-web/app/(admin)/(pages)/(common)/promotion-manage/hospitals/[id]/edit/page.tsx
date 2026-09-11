import type { Metadata } from "next";
import HospitalPromotionEditClient from "@/components/hospital-promotion/form/HospitalPromotionEditClient";

export const metadata: Metadata = { title: "병의원 프로모션 수정 | 뷰랩 관리자" };

export default function HospitalPromotionEditPage() {
  return <HospitalPromotionEditClient />;
}
