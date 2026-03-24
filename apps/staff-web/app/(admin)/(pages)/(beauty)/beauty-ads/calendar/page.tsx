import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-ads/calendar");

export default function BeautyAdsCalendarPage() {
    return renderAdminPage("/beauty-ads/calendar");
}
