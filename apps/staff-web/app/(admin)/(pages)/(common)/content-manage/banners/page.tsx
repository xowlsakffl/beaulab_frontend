import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/content-manage/banners");

export default function ContentBannersPage() {
    return renderAdminPage("/content-manage/banners");
}
