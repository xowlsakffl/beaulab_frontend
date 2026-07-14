import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/notice-manage/hospital-notices");

export default function HospitalNoticesPage() {
  return renderAdminPage("/notice-manage/hospital-notices");
}
