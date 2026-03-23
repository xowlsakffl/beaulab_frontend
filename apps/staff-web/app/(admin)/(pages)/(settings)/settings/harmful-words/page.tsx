import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/settings/harmful-words");

export default function HarmfulWordsPage() {
    return renderAdminPage("/settings/harmful-words");
}
