import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-ads/products");

export default function BeautyAdsProductsPage() {
    return renderAdminPage("/beauty-ads/products");
}
