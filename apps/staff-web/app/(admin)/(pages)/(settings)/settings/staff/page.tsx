import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/settings/staff");

export default function SettingsStaffPage() {
    return renderAdminPage("/settings/staff");
}
