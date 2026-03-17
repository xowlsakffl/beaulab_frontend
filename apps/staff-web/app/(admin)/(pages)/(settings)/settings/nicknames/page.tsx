import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/settings/nicknames");

export default function SettingsNicknamesPage() {
    return renderAdminPage("/settings/nicknames");
}
