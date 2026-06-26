import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-ads-manage/calendar");

export default function BeautyAdsCalendarPage() {
    return renderAdminPage("/beauty-ads-manage/calendar");
}
