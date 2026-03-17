import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/posts/surgery-reviews");

export default function SurgeryReviewsPage() {
    return renderAdminPage("/posts/surgery-reviews");
}
