import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/customer-db/remote-consultations");

export default function CustomerDbRemoteConsultationsPage() {
    return renderAdminPage("/customer-db/remote-consultations");
}
