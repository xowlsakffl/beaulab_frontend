import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import HospitalDetailPageClient from "./HospitalDetailPageClient";

export const metadata: Metadata = {
  title: "병의원 상세 | 뷰랩 관리자",
};

export default function HospitalDetailPage() {
  return (
    <div className="space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="병의원 상세"
          homeLabel="관리자"
          items={[
            { label: "병의원 관리" },
            { label: "병의원", href: "/hospitals" },
          ]}
        />
      </div>

      <HospitalDetailPageClient />
    </div>
  );
}
