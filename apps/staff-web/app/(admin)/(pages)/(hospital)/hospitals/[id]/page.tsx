import { PageBreadcrumb } from "@beaulab/ui-admin";
import { Metadata } from "next";
import HospitalsTableClient from "./HospitalsTableClient";

export const metadata: Metadata = {
  title: "병원 리스트 | 뷰랩 관리자",
  description: "뷰랩 관리자의 병원 리스트 페이지입니다.",
};

export default function HospitalsPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="병원 리스트" />
      <HospitalsTableClient />
    </div>
  );
}
