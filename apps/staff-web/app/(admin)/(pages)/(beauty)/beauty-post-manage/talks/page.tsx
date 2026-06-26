import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-post-manage/talks");

export default function BeautyPostsTalksPage() {
    return renderAdminPage("/beauty-post-manage/talks");
}
