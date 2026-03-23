import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/ads/calendar");

export default function AdsCalendarPage() {
    return renderAdminPage("/ads/calendar");
}
