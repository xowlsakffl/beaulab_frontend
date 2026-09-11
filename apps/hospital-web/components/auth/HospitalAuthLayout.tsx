import type { ReactNode } from "react";
import { AuthLayout } from "@beaulab/ui-admin/layouts";

export default function HospitalAuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthLayout brandName="뷰랩 병의원 관리자" brandDescription="병의원 운영을 위한 뷰랩 파트너 서비스입니다.">
      {children}
    </AuthLayout>
  );
}
