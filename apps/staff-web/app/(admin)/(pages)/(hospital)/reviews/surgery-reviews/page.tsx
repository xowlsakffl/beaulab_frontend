import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";
import { HospitalReviewsTableClient } from "../HospitalReviewsTableClient";

export const metadata = buildAdminPageMetadata("/reviews/surgery-reviews");

export default function SurgeryReviewsPage() {
    return (
        <div className="min-w-0 space-y-6">
      <HospitalReviewsTableClient type="surgery" />
    </div>
    );
}
