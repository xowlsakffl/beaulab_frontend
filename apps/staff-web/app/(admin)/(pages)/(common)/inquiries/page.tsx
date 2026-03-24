import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/inquiries");

export default function InquiriesPage() {
    return renderAdminPage("/inquiries");
}
