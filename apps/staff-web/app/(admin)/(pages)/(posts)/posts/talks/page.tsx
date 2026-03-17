import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/posts/talks");

export default function PostsTalksPage() {
    return renderAdminPage("/posts/talks");
}
