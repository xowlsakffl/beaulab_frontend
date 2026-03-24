import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/faqs");

export default function FaqsPage() {
    return renderAdminPage("/faqs");
}
