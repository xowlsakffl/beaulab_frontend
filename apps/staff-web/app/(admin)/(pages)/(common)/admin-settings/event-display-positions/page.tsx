import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/admin-settings/event-display-positions");

export default function EventDisplayPositionsPage() {
  return renderAdminPage("/admin-settings/event-display-positions");
}
