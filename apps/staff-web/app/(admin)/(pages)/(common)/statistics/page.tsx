import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/statistics");

export default function StatisticsPage() {
    return renderAdminPage("/statistics");
}
