import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/content-manage/popups");

export default function ContentPopupsPage() {
  return renderAdminPage("/content-manage/popups");
}
