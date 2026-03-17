import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/notices");

export default function NoticesPage() {
    return renderAdminPage("/notices");
}
