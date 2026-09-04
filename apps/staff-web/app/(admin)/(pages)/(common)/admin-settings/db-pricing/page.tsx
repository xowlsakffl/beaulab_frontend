import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/admin-settings/db-pricing");

export default function DbPricingSettingsPage() {
  return renderAdminPage("/admin-settings/db-pricing");
}
