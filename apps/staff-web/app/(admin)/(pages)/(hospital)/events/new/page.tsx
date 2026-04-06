import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";
import HospitalEventsCreateFormClient from "./HospitalEventsCreateFormClient";

export const metadata: Metadata = {
  title: "이벤트 등록 | 뷰랩 관리자",
  description: "뷰랩 관리자 병의원 이벤트 페이지입니다.",
};

export default function HospitalEventsCreatePage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="이벤트 등록"
        homeLabel="관리자"
        items={[
          { label: "광고 관리" },
          { label: "이벤트", href: "/ads/events" },
        ]}
      />
      <HospitalEventsCreateFormClient />
    </div>
  );
}
