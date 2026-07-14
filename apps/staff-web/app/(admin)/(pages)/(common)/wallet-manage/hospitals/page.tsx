import { buildAdminPageMetadata, renderAdminPage } from "@/lib/common/routing/admin-pages";

export const metadata = buildAdminPageMetadata("/wallet-manage/hospitals");

export default function WalletHospitalsPage() {
  return renderAdminPage("/wallet-manage/hospitals");
}
