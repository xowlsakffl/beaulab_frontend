import type { Metadata } from "next";
import React from "react";
import { Card, CardDescription, CardTitle, PageBreadcrumb } from "@beaulab/ui-admin";

export const metadata: Metadata = {
  title: "대시보드 | 뷰랩 관리자",
  description: "뷰랩 관리자 대시보드입니다.",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="대시보드" homeLabel="관리자" />
      <Card as="section" className="p-6">
        <CardTitle className="text-lg">운영 현황</CardTitle>
        <CardDescription className="mt-2">
          이 화면은 스태프 운영 지표를 배치하는 관리자 홈입니다. 템플릿 위젯은 제거했고,
          실제 병의원 운영 데이터에 맞는 카드와 차트만 추가하도록 기준을 정리했습니다.
        </CardDescription>
      </Card>
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">병의원 관리</p>
          <p className="mt-2 text-base font-semibold text-gray-800 dark:text-white/90">
            목록, 등록, 상세 확장을 이 영역에서 연결합니다.
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">권한 정책</p>
          <p className="mt-2 text-base font-semibold text-gray-800 dark:text-white/90">
            라우트 접근은 `route-permissions`와 세션 권한으로 통제됩니다.
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">추가 작업</p>
          <p className="mt-2 text-base font-semibold text-gray-800 dark:text-white/90">
            템플릿 잔재 대신 도메인 위젯만 쌓도록 기준점을 만든 상태입니다.
          </p>
        </Card>
      </section>
    </div>
  );
}
