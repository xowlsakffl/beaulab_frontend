import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-wallet-manage/beauties");

export default function BeautyWalletBeautiesPage() {
    return renderAdminPage("/beauty-wallet-manage/beauties");
}
