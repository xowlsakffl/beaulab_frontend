import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/reported-content/talks");

export default function ReportedTalksPage() {
    return renderAdminPage("/reported-content/talks");
}
