import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/agencies");

export default function AgenciesPage() {
    return renderAdminPage("/agencies");
}
