import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";
import { ReportedContentTableClient } from "../ReportedContentTableClient";

export const metadata = buildAdminPageMetadata("/reported-post-manage/surgery-reviews");

export default function ReportedSurgeryReviewsPage() {
  return (
    <div className="min-w-0 space-y-6">
      <ReportedContentTableClient type="surgery-reviews" />
    </div>
  );
}
