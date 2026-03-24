import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/customer-db/events");

export default function CustomerDbEventsPage() {
    return renderAdminPage("/customer-db/events");
}
