import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import HospitalEventDetailPageClient from "./HospitalEventDetailPageClient";

export const metadata: Metadata = {
  title: "이벤트 상세 | 뷰랩 관리자",
};

export default function HospitalEventDetailPage() {
  return (
    <div className="space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="이벤트 상세"
          homeLabel="관리자"
          items={[
            { label: "광고 관리" },
            { label: "이벤트 관리", href: "/events" },
          ]}
        />
      </div>

      <HospitalEventDetailPageClient />
    </div>
  );
}
