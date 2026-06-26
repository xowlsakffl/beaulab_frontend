import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";

import HospitalEventDBsTableClient from "./HospitalEventDBsTableClient";

export const metadata = buildAdminPageMetadata("/customer-db-manage/events");

export default function CustomerDbEventsPage() {
    return (
        <div className="space-y-4">
            <HospitalEventDBsTableClient />
        </div>
    );
}
