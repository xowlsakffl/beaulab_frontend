import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";
import { ReportedContentTableClient } from "../ReportedContentTableClient";

export const metadata = buildAdminPageMetadata("/reported-content/hospital-evaluations");

export default function ReportedHospitalEvaluationsPage() {
  return (
    <div className="min-w-0 space-y-6">
      <ReportedContentTableClient type="hospital-evaluations" />
    </div>
  );
}
