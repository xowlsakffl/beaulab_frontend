import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";
import React from "react";
import ProfilePageClient from "./ProfilePageClient";

export const metadata: Metadata = {
  title: "내 프로필 | 뷰랩 관리자",
  description: "뷰랩 관리자 프로필 페이지입니다.",
};

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="내 프로필" homeLabel="관리자" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          계정 정보
        </h3>
        <ProfilePageClient />
      </div>
    </div>
  );
}
