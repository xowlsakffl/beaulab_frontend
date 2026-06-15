import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import { HospitalEventsEditFormClient } from "../../new/HospitalEventsCreateFormClient";

export const metadata: Metadata = {
  title: "이벤트 수정 | 뷰랩 관리자",
};

export default async function HospitalEventsEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);

  return (
    <div className="space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="이벤트 수정"
          homeLabel="관리자"
          items={[
            { label: "광고 관리" },
            { label: "이벤트 관리", href: "/events" },
          ]}
        />
      </div>

      <HospitalEventsEditFormClient eventId={eventId} />
    </div>
  );
}
