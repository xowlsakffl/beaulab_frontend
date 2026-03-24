import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/posts/hospital-reviews");

export default function HospitalReviewsPage() {
    return renderAdminPage("/posts/hospital-reviews");
}
