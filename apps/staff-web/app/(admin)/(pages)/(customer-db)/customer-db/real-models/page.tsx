import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/customer-db/real-models");

export default function CustomerDbRealModelsPage() {
    return renderAdminPage("/customer-db/real-models");
}
