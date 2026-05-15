import { PageBreadcrumb } from "@beaulab/ui-admin";
import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";
import { ReportedContentTableClient } from "../ReportedContentTableClient";

export const metadata = buildAdminPageMetadata("/reported-content/surgery-reviews");

export default function ReportedSurgeryReviewsPage() {
  return (
    <div className="min-w-0 space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="성형후기"
          homeLabel="관리자"
          items={[{ label: "신고게시물 관리" }]}
        />
      </div>

      <ReportedContentTableClient type="surgery-reviews" />
    </div>
  );
}
