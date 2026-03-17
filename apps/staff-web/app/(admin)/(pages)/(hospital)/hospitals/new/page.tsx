import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";
import HospitalsCreateFormClient from "./HospitalsCreateFormClient";

export const metadata: Metadata = {
  title: "병의원 등록 | 뷰랩 관리자",
  description: "뷰랩 관리자 병의원 등록 페이지입니다.",
};

export default function HospitalsCreatePage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="병의원 등록"
        homeLabel="관리자"
        items={[{ label: "병의원", href: "/hospitals" }]}
      />
      <HospitalsCreateFormClient />
    </div>
  );
}
