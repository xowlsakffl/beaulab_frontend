import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/faqs");

export default function FaqsPage() {
    return renderAdminPage("/faqs");
}
