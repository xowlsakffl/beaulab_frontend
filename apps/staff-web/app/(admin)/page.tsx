import type { Metadata } from "next";
import React from "react";
import { PageBreadcrumb } from "@beaulab/ui-admin";

export const metadata: Metadata = {
  title: "대시보드 | 뷰랩 관리자",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="xl:hidden">
        <PageBreadcrumb pageTitle="대시보드" homeLabel="관리자" />
      </div>
    </div>
  );
}
