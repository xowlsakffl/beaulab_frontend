import { Card, CardTitle } from "@beaulab/ui-admin";
import type { Metadata } from "next";
import React from "react";
import ProfilePageClient from "./ProfilePageClient";

export const metadata: Metadata = {
  title: "내 프로필 | 뷰랩 관리자",
};

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <Card className="p-5 lg:p-6">
        <CardTitle className="mb-5 text-lg lg:mb-7">계정 정보</CardTitle>
        <ProfilePageClient />
      </Card>
    </div>
  );
}
