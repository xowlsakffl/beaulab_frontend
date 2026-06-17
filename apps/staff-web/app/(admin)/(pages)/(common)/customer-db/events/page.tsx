import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";

import HospitalEventConsultationsTableClient from "./HospitalEventConsultationsTableClient";

export const metadata = buildAdminPageMetadata("/customer-db/events");

export default function CustomerDbEventsPage() {
    return (
        <div className="space-y-4">
            <HospitalEventConsultationsTableClient />
        </div>
    );
}
