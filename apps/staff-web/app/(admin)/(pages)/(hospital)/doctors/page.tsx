import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/doctors");

export default function DoctorsPage() {
    return renderAdminPage("/doctors");
}
