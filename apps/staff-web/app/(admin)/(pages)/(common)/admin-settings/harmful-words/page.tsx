import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/admin-settings/harmful-words");

export default function HarmfulWordsPage() {
  return renderAdminPage("/admin-settings/harmful-words");
}
