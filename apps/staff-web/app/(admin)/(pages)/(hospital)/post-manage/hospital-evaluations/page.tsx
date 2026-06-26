import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";
import { HospitalEvaluationsTableClient } from "./HospitalEvaluationsTableClient";

export const metadata = buildAdminPageMetadata("/post-manage/hospital-evaluations");

export default function HospitalEvaluationsPage() {
  return (
    <div className="min-w-0 space-y-6">
      <HospitalEvaluationsTableClient />
    </div>
  );
}
