import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/experts");

export default function ExpertsPage() {
    return renderAdminPage("/experts");
}
