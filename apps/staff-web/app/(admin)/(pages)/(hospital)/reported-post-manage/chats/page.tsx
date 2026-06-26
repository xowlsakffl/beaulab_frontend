import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";
import { ReportedContentTableClient } from "../ReportedContentTableClient";

export const metadata = buildAdminPageMetadata("/reported-post-manage/chats");

export default function ReportedChatsPage() {
  return (
    <div className="min-w-0 space-y-6">
      <ReportedContentTableClient type="chats" />
    </div>
  );
}
