import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";
import AccountUsersTableClient from "./AccountUsersTableClient";

export const metadata: Metadata = {
  title: "일반 회원 | 뷰랩 관리자",
};

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb
          pageTitle="일반 회원"
          homeLabel="관리자"
          items={[{ label: "회원 관리" }]}
        />
      </div>

      <AccountUsersTableClient />
    </div>
  );
}
