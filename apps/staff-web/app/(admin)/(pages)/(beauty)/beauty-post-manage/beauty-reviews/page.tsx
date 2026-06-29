import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-post-manage/beauty-reviews");

export default function BeautyPostsBeautyReviewsPage() {
  return renderAdminPage("/beauty-post-manage/beauty-reviews");
}
