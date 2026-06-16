import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";
import { HospitalReviewsTableClient } from "../HospitalReviewsTableClient";

export const metadata = buildAdminPageMetadata("/reviews/treatment-reviews");

export default function TreatmentReviewsPage() {
    return (
        <div className="min-w-0 space-y-6">
      <HospitalReviewsTableClient type="treatment" />
    </div>
    );
}
