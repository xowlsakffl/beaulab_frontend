import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-notice-manage/notices");

export default function BeautyNoticesPage() {
  return renderAdminPage("/beauty-notice-manage/notices");
}
