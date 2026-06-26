import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";
import { ReportedContentTableClient } from "../ReportedContentTableClient";

export const metadata = buildAdminPageMetadata("/reported-post-manage/talks");

export default function ReportedTalksPage() {
  return (
    <div className="min-w-0 space-y-6">
      <ReportedContentTableClient type="talks" />
    </div>
  );
}
