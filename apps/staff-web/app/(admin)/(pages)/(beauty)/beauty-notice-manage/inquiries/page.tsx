import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-notice-manage/inquiries");

export default function BeautyInquiriesPage() {
  return renderAdminPage("/beauty-notice-manage/inquiries");
}
