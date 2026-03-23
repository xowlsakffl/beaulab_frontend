import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/ads/products");

export default function AdsProductsPage() {
    return renderAdminPage("/ads/products");
}
