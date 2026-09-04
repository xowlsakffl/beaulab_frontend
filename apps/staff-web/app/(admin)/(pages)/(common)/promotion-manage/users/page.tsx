import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/promotion-manage/users");

export default function UserPromotionsPage() {
  return renderAdminPage("/promotion-manage/users");
}
