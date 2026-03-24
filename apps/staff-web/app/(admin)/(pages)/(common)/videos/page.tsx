import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/videos");

export default function VideosPage() {
    return renderAdminPage("/videos");
}
