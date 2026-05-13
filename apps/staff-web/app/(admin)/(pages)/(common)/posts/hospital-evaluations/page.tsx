import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/posts/hospital-evaluations");

export default function HospitalEvaluationsPage() {
    return renderAdminPage("/posts/hospital-evaluations");
}
