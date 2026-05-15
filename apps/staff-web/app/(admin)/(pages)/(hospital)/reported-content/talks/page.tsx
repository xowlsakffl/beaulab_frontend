import { PageBreadcrumb } from "@beaulab/ui-admin";
import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";
import { ReportedContentTableClient } from "../ReportedContentTableClient";

export const metadata = buildAdminPageMetadata("/reported-content/talks");

export default function ReportedTalksPage() {
  return (
    <div className="min-w-0 space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="토크"
          homeLabel="관리자"
          items={[{ label: "신고게시물 관리" }]}
        />
      </div>

      <ReportedContentTableClient type="talks" />
    </div>
  );
}
