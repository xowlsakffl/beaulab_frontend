import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-customer-db/real-models");

export default function BeautyCustomerDbRealModelsPage() {
    return renderAdminPage("/beauty-customer-db/real-models");
}
