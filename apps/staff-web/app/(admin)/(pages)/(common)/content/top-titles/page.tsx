import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/content/top-titles");

export default function ContentTopTitlesPage() {
    return renderAdminPage("/content/top-titles");
}
