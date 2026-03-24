import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-reported-content/posts");

export default function BeautyReportedContentPostsPage() {
    return renderAdminPage("/beauty-reported-content/posts");
}
