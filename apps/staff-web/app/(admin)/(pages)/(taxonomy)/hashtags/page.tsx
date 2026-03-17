import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/hashtags");

export default function HashtagsPage() {
    return renderAdminPage("/hashtags");
}
