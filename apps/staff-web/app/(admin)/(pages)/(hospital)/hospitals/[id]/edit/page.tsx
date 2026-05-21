import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import HospitalEditFormClient from "./HospitalEditFormClient";

export const metadata: Metadata = {
  title: "병의원 수정 | 뷰랩 관리자",
};

export default function HospitalEditPage() {
  return (
    <div className="space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="병의원 수정"
          homeLabel="관리자"
          items={[
            { label: "병의원 관리" },
            { label: "병의원", href: "/hospitals" },
          ]}
        />
      </div>

      <HospitalEditFormClient />
    </div>
  );
}
