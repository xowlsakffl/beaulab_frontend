import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/beauty-promotion-manage/beauties");

export default function BeautyPromotionsPage() {
  return renderAdminPage("/beauty-promotion-manage/beauties");
}
