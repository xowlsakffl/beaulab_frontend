import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-notice-manage/faqs");

export default function BeautyFaqsPage() {
  return renderAdminPage("/beauty-notice-manage/faqs");
}
