import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-shop-manage/experts");

export default function ExpertsPage() {
  return renderAdminPage("/beauty-shop-manage/experts");
}
