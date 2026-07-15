import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";

import EventAdsCalendarPageClient from "./EventAdsCalendarPageClient";

export const metadata = buildAdminPageMetadata("/ads-manage/calendar");

export default function AdsCalendarPage() {
  return (
    <div className="space-y-6">
      <EventAdsCalendarPageClient />
    </div>
  );
}
