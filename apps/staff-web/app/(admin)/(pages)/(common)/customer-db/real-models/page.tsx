import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";

import HospitalEventRealModelDBsTableClient from "./HospitalEventRealModelDBsTableClient";

export const metadata = buildAdminPageMetadata("/customer-db/real-models");

export default function CustomerDbRealModelsPage() {
    return (
        <div className="space-y-4">
            <HospitalEventRealModelDBsTableClient />
        </div>
    );
}
