import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/notice-manage/faqs");

export default function FaqsPage() {
    return renderAdminPage("/notice-manage/faqs");
}
