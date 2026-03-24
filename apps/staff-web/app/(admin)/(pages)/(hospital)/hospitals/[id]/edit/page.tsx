import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import HospitalEditFormClient from "./HospitalEditFormClient";

export const metadata: Metadata = {
  title: "병의원 수정 | 뷰랩 관리자",
  description: "뷰랩 관리자 병의원 수정 페이지입니다.",
};

export default function HospitalEditPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="병의원 수정"
        homeLabel="관리자"
        items={[
          { label: "병의원 관리" },
          { label: "병의원 목록", href: "/hospitals" },
        ]}
      />
      <HospitalEditFormClient />
    </div>
  );
}
