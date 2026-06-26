import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-post-manage/beauty-posts");

export default function BeautyPostsBeautyPostsPage() {
    return renderAdminPage("/beauty-post-manage/beauty-posts");
}
