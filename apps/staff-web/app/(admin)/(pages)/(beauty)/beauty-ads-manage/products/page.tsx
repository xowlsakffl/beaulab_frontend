import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-ads-manage/products");

export default function BeautyAdsProductsPage() {
  return renderAdminPage("/beauty-ads-manage/products");
}
