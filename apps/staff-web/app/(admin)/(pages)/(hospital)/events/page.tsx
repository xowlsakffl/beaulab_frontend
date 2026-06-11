import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import HospitalEventsTableClient from "./HospitalEventsTableClient";

export const metadata: Metadata = {
  title: "이벤트 관리 | 뷰랩 관리자",
};

export default function HospitalEventsPage() {
  return (
    <div className="space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="이벤트 관리"
          homeLabel="관리자"
          items={[
            { label: "광고 관리" },
            { label: "이벤트 관리", href: "/events" },
          ]}
        />
      </div>

      <HospitalEventsTableClient />
    </div>
  );
}
