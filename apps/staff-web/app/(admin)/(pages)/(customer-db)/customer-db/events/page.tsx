import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/customer-db/events");

export default function CustomerDbEventsPage() {
    return renderAdminPage("/customer-db/events");
}
