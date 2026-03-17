import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/videos");

export default function VideosPage() {
    return renderAdminPage("/videos");
}
