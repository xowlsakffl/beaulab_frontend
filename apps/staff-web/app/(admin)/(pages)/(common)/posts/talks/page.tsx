import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/posts/talks");

export default function PostsTalksPage() {
    return renderAdminPage("/posts/talks");
}
