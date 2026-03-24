import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

import DoctorsTableClient from "./DoctorsTableClient";

export const metadata: Metadata = {
  title: "의료진 목록 | 뷰랩 관리자",
  description: "뷰랩 관리자 의료진 목록 페이지입니다.",
};

export default function DoctorsPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="의료진"
        homeLabel="관리자"
        items={[{ label: "병의원 관리" }]}
      />
      <DoctorsTableClient />
    </div>
  );
}
