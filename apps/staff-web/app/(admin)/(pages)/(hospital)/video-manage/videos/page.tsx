import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";

import VideosTableClient from "./VideosTableClient";

export const metadata = buildAdminPageMetadata("/video-manage/videos");

export default function VideosPage() {
  return (
    <div className="space-y-6">
      <VideosTableClient />
    </div>
  );
}
