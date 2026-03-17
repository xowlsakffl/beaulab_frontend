import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/ads/events");

export default function AdsEventsPage() {
    return renderAdminPage("/ads/events");
}
