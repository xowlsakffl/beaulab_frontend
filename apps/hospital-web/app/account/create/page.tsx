import type { Metadata } from "next";
import { redirect } from "next/navigation";

import HospitalAccountCreatePageClient from "./HospitalAccountCreatePageClient";

export const metadata: Metadata = {
  title: "병의원 계정 생성 | 뷰랩",
};

type HospitalAccountCreatePageProps = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

const TOKEN_PATTERN = /^[A-Za-z0-9]{64}$/;

export default async function HospitalAccountCreatePage({ searchParams }: HospitalAccountCreatePageProps) {
  const query = await searchParams;
  const invitationToken = typeof query.token === "string" ? query.token : "";
  if (!TOKEN_PATTERN.test(invitationToken)) {
    redirect("/error/419");
  }

  return <HospitalAccountCreatePageClient key={invitationToken} invitationToken={invitationToken} />;
}
