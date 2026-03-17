import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/inquiries");

export default function InquiriesPage() {
    return renderAdminPage("/inquiries");
}
