import { Metadata } from "next";
import React from "react";
import { PageBreadcrumb } from "@beaulab/ui-admin";

export const metadata: Metadata = {
  title: "병원 리스트 | 뷰랩 관리자",
  description:
    "뷰랩 관리자의 병원 리스트 페이지입니다.",
};
export default function page() {
  return (
    <div>
      <PageBreadcrumb pageTitle="병원 리스트" />

    </div>
  );
}
