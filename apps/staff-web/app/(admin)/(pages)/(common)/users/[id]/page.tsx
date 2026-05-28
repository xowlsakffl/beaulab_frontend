import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import AccountUserDetailPageClient from "./AccountUserDetailPageClient";

export const metadata: Metadata = {
  title: "일반회원 상세 | 뷰랩 관리자",
};

export default function AccountUserDetailPage() {
  return (
    <div className="min-w-0 space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="일반회원 상세"
          homeLabel="관리자"
          items={[
            { label: "회원 관리" },
            { label: "일반회원", href: "/users" },
          ]}
        />
      </div>

      <AccountUserDetailPageClient />
    </div>
  );
}
