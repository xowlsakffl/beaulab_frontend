import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/notice-manage/inquiries");

export default function InquiriesPage() {
  return renderAdminPage("/notice-manage/inquiries");
}
