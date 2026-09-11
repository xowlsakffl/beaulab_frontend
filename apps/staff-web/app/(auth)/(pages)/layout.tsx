import type { ReactNode } from "react";
import { AuthLayout } from "@beaulab/ui-admin/layouts";

export default function StaffAuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthLayout className="min-w-[1440px]" brandDescription="병의원 운영 뷰랩 관리자입니다.">
      {children}
    </AuthLayout>
  );
}
