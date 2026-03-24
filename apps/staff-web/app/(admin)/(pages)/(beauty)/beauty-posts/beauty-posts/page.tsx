import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-posts/beauty-posts");

export default function BeautyPostsBeautyPostsPage() {
    return renderAdminPage("/beauty-posts/beauty-posts");
}
