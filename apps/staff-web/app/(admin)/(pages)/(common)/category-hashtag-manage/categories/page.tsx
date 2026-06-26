import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/category-hashtag-manage/categories");

export default function CategoriesPage() {
    return renderAdminPage("/category-hashtag-manage/categories");
}
