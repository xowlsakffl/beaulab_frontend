import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import DoctorsCreateFormClient from "./DoctorsCreateFormClient";

export const metadata: Metadata = {
  title: "의료진 등록 | 뷰랩 관리자",
};

export default function DoctorsCreatePage() {
  return (
    <div className="space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="의료진 등록"
          homeLabel="관리자"
          items={[
            { label: "병의원 관리" },
            { label: "의료진", href: "/doctors" },
          ]}
        />
      </div>

      <DoctorsCreateFormClient />
    </div>
  );
}
