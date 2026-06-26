import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/admin-settings/staff");

export default function SettingsStaffPage() {
    return renderAdminPage("/admin-settings/staff");
}
