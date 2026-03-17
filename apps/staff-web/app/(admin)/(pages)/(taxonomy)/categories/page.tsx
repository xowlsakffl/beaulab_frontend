import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/categories");

export default function CategoriesPage() {
    return renderAdminPage("/categories");
}
