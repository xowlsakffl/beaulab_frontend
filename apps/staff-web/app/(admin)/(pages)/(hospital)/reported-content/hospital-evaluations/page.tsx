import { PageBreadcrumb } from "@beaulab/ui-admin";
import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";
import { ReportedContentTableClient } from "../ReportedContentTableClient";

export const metadata = buildAdminPageMetadata("/reported-content/hospital-evaluations");

export default function ReportedHospitalEvaluationsPage() {
  return (
    <div className="min-w-0 space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="병의원 평가"
          homeLabel="관리자"
          items={[{ label: "신고게시물 관리" }]}
        />
      </div>

      <ReportedContentTableClient type="hospital-evaluations" />
    </div>
  );
}
