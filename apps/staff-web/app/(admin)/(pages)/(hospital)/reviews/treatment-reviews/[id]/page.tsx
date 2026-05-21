import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import HospitalReviewDetailPageClient from "../../HospitalReviewDetailPageClient";

export const metadata: Metadata = {
  title: "시술후기 상세 | 뷰랩 관리자",
};

export default function TreatmentReviewDetailPage() {
  return (
    <div className="min-w-0 space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="시술후기 상세"
          homeLabel="관리자"
          items={[
            { label: "게시물 관리" },
            { label: "시술후기", href: "/reviews/treatment-reviews" },
          ]}
        />
      </div>

      <HospitalReviewDetailPageClient type="treatment" />
    </div>
  );
}
