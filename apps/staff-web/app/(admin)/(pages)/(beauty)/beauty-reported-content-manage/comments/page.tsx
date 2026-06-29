import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-reported-content-manage/comments");

export default function BeautyReportedContentCommentsPage() {
  return renderAdminPage("/beauty-reported-content-manage/comments");
}
