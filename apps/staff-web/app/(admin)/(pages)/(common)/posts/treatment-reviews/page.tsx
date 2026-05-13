import { PageBreadcrumb } from "@beaulab/ui-admin";
import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";
import { HospitalReviewsTableClient } from "@/components/hospital-review/list/HospitalReviewsTableClient";

export const metadata = buildAdminPageMetadata("/posts/treatment-reviews");

export default function TreatmentReviewsPage() {
    return (
        <div className="min-w-0 space-y-6">
            <div className="xl:hidden">
                <PageBreadcrumb
                    pageTitle="시술후기"
                    homeLabel="관리자"
                    items={[{ label: "게시물 관리" }]}
                />
            </div>

            <HospitalReviewsTableClient type="treatment" />
        </div>
    );
}
