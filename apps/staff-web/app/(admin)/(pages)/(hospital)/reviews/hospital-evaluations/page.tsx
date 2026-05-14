import { PageBreadcrumb } from "@beaulab/ui-admin";
import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";
import { HospitalEvaluationsTableClient } from "./HospitalEvaluationsTableClient";

export const metadata = buildAdminPageMetadata("/reviews/hospital-evaluations");

export default function HospitalEvaluationsPage() {
  return (
    <div className="min-w-0 space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="병의원 평가"
          homeLabel="관리자"
          items={[{ label: "게시물 관리" }]}
        />
      </div>

      <HospitalEvaluationsTableClient />
    </div>
  );
}
