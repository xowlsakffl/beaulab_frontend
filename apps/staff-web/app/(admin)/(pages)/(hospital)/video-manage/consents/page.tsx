import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/video-manage/consents");

export default function VideoConsentsPage() {
  return renderAdminPage("/video-manage/consents");
}
