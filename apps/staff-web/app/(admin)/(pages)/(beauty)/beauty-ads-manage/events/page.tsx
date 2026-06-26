import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-ads-manage/events");

export default function BeautyAdsEventsPage() {
    return renderAdminPage("/beauty-ads-manage/events");
}
