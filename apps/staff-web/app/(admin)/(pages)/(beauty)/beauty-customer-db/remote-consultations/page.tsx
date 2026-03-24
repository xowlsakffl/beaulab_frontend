import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-customer-db/remote-consultations");

export default function BeautyCustomerDbRemoteConsultationsPage() {
    return renderAdminPage("/beauty-customer-db/remote-consultations");
}
