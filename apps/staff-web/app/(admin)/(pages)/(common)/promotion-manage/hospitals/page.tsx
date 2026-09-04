import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/promotion-manage/hospitals");

export default function HospitalPromotionsPage() {
  return renderAdminPage("/promotion-manage/hospitals");
}
