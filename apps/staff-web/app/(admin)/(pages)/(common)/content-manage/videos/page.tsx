import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/content-manage/videos");

export default function ContentVideosPage() {
  return renderAdminPage("/content-manage/videos");
}
