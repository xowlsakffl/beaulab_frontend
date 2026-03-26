import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import DoctorEditFormClient from "./DoctorEditFormClient";

export const metadata: Metadata = {
  title: "의료진 수정 | 뷰랩 관리자",
  description: "뷰랩 관리자 의료진 수정 페이지입니다.",
};

export default function DoctorEditPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="의료진 수정"
        homeLabel="관리자"
        items={[
          { label: "병의원 관리" },
          { label: "의료진", href: "/doctors" },
        ]}
      />

      <DoctorEditFormClient />
    </div>
  );
}
