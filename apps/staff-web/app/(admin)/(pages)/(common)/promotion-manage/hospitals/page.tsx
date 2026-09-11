import { buildAdminPageMetadata } from "@/lib/common/routing/admin-pages";
import HospitalPromotionsClient from "./HospitalPromotionsClient";

export const metadata = buildAdminPageMetadata("/promotion-manage/hospitals");

export default function HospitalPromotionsPage() {
  return <HospitalPromotionsClient />;
}
