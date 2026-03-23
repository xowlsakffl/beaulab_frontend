import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/wallet/history");

export default function WalletHistoryPage() {
    return renderAdminPage("/wallet/history");
}
