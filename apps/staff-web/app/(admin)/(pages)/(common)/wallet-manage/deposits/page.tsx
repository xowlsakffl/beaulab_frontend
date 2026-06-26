import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/wallet-manage/deposits");

export default function WalletDepositsPage() {
    return renderAdminPage("/wallet-manage/deposits");
}
