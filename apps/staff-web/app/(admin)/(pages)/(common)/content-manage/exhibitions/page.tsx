import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/content-manage/exhibitions");

export default function ContentExhibitionsPage() {
  return renderAdminPage("/content-manage/exhibitions");
}
