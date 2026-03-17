import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/reported-content/hospital-reviews");

export default function ReportedHospitalReviewsPage() {
    return renderAdminPage("/reported-content/hospital-reviews");
}
