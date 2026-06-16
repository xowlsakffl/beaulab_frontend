import type { Metadata } from "next";
import AccountUsersTableClient from "./AccountUsersTableClient";

export const metadata: Metadata = {
  title: "일반 회원 | 뷰랩 관리자",
};

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <AccountUsersTableClient />
    </div>
  );
}
