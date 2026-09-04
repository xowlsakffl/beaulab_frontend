import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/admin-settings/ad-pricing");

export default function AdPricingSettingsPage() {
  return renderAdminPage("/admin-settings/ad-pricing");
}
