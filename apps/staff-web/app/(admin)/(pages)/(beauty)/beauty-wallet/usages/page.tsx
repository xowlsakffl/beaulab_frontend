import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-wallet/usages");

export default function BeautyWalletUsagesPage() {
    return renderAdminPage("/beauty-wallet/usages");
}
