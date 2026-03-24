import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/wallet/deposits");

export default function WalletDepositsPage() {
    return renderAdminPage("/wallet/deposits");
}
