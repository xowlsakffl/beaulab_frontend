import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import HospitalEvaluationDetailPageClient from "../HospitalEvaluationDetailPageClient";

export const metadata: Metadata = {
  title: "병의원 평가 상세 | 뷰랩 관리자",
  description: "뷰랩 관리자 병의원 평가 상세 페이지입니다.",
};

export default function HospitalEvaluationDetailPage() {
  return (
    <div className="min-w-0 space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="병의원 평가 상세"
          homeLabel="관리자"
          items={[
            { label: "게시물 관리" },
            { label: "병의원 평가", href: "/reviews/hospital-evaluations" },
          ]}
        />
      </div>

      <HospitalEvaluationDetailPageClient />
    </div>
  );
}
