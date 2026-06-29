import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/admin-settings/nicknames");

export default function SettingsNicknamesPage() {
  return renderAdminPage("/admin-settings/nicknames");
}
