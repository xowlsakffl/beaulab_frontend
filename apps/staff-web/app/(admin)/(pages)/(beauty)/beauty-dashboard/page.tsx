import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-dashboard");

export default function BeautyDashboardPage() {
    return renderAdminPage("/beauty-dashboard");
}
