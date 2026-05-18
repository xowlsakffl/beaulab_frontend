import { PageBreadcrumb } from "@beaulab/ui-admin";
import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";
import { ReportedContentTableClient } from "../ReportedContentTableClient";

export const metadata = buildAdminPageMetadata("/reported-content/chats");

export default function ReportedChatsPage() {
  return (
    <div className="min-w-0 space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="채팅"
          homeLabel="관리자"
          items={[{ label: "신고게시물 관리" }]}
        />
      </div>

      <ReportedContentTableClient type="chats" />
    </div>
  );
}
