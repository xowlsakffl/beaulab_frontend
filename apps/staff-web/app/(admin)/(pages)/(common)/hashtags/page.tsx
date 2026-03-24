import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/hashtags");

export default function HashtagsPage() {
    return renderAdminPage("/hashtags");
}
