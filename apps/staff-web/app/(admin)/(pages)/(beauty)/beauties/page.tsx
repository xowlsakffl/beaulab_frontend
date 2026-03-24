import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauties");

export default function BeautiesPage() {
    return renderAdminPage("/beauties");
}
