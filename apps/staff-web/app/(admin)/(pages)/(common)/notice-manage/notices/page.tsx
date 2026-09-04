import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";

import NoticesTableClient from "./NoticesTableClient";

export const metadata = buildAdminPageMetadata("/notice-manage/notices");

export default function NoticesPage() {
  return (
    <div className="space-y-6">
      <NoticesTableClient />
    </div>
  );
}
