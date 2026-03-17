import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/reported-content/surgery-reviews");

export default function ReportedSurgeryReviewsPage() {
    return renderAdminPage("/reported-content/surgery-reviews");
}
