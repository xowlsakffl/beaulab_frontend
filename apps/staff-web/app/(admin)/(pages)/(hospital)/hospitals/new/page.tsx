import { PageBreadcrumb } from "@beaulab/ui-admin";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "병원 생성 | 뷰랩 관리자",
  description: "뷰랩 관리자의 병원 생성 페이지입니다.",
};

export default function HospitalsCreatePage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="병원 생성" />
    </div>
  );
}
