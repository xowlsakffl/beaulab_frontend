import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/ads-manage/products");

export default function AdsProductsPage() {
    return renderAdminPage("/ads-manage/products");
}
