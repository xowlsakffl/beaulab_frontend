import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/wallet/history");

export default function WalletHistoryPage() {
    return renderAdminPage("/wallet/history");
}
