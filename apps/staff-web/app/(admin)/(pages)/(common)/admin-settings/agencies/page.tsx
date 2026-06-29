import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/admin-settings/agencies");

export default function AgenciesPage() {
  return renderAdminPage("/admin-settings/agencies");
}
