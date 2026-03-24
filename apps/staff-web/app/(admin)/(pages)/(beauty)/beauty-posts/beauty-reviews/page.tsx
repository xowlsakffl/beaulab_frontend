import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-posts/beauty-reviews");

export default function BeautyPostsBeautyReviewsPage() {
    return renderAdminPage("/beauty-posts/beauty-reviews");
}
