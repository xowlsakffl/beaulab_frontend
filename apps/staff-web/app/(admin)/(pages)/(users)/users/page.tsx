import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/users");

export default function UsersPage() {
    return renderAdminPage("/users");
}
