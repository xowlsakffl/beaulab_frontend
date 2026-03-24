import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-posts/talks");

export default function BeautyPostsTalksPage() {
    return renderAdminPage("/beauty-posts/talks");
}
