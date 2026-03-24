import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/content/banners");

export default function ContentBannersPage() {
    return renderAdminPage("/content/banners");
}
