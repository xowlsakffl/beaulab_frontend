import type { Metadata } from "next";
import HospitalPasswordForgotPageClient from "./HospitalPasswordForgotPageClient";

export const metadata: Metadata = {
  title: "병의원 비밀번호 찾기 | 뷰랩",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function HospitalPasswordForgotPage() {
  return <HospitalPasswordForgotPageClient />;
}
