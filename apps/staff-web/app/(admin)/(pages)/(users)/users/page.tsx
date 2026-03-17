import { buildAdminPageMetadata, renderAdminPage } from "@/lib/admin-pages";

export const metadata = buildAdminPageMetadata("/users");

export default function UsersPage() {
    return renderAdminPage("/users");
}
