import type { Metadata } from "next";
import { redirect } from "next/navigation";

import HospitalPasswordResetPageClient from "./HospitalPasswordResetPageClient";

export const metadata: Metadata = {
  title: "병의원 비밀번호 재설정 | 뷰랩",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function HospitalPasswordResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : "";
  if (!/^[A-Za-z0-9]{64}$/.test(token)) redirect("/error/419");

  return <HospitalPasswordResetPageClient key={token} token={token} />;
}
