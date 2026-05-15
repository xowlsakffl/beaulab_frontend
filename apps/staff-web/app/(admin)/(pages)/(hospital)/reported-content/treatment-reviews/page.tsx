import { PageBreadcrumb } from "@beaulab/ui-admin";
import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";
import { ReportedContentTableClient } from "../ReportedContentTableClient";

export const metadata = buildAdminPageMetadata("/reported-content/treatment-reviews");

export default function ReportedTreatmentReviewsPage() {
  return (
    <div className="min-w-0 space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="시술후기"
          homeLabel="관리자"
          items={[{ label: "신고게시물 관리" }]}
        />
      </div>

      <ReportedContentTableClient type="treatment-reviews" />
    </div>
  );
}
