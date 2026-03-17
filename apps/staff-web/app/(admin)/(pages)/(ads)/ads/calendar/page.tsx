import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/ads/calendar");

export default function AdsCalendarPage() {
    return renderAdminPage("/ads/calendar");
}
