import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";
import HospitalEventsCreateFormClient from "./HospitalEventsCreateFormClient";

export const metadata: Metadata = {
  title: "이벤트 등록 | 뷰랩 관리자",};

export default function HospitalEventsCreatePage() {
  return (
    <div className="space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="이벤트 등록"
          homeLabel="관리자"
          items={[
            { label: "광고 관리" },
            { label: "이벤트", href: "/ads/events" },
          ]}
        />
      </div>

      <HospitalEventsCreateFormClient />
    </div>
  );
}
