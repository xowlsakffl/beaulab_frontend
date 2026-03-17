import { PageBreadcrumb } from "@beaulab/ui-admin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "병의원 상세 | 뷰랩 관리자",
  description: "뷰랩 관리자 병의원 상세 페이지입니다.",
};

export default function HospitalDetailPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="병의원 상세"
        homeLabel="관리자"
        items={[{ label: "병의원", href: "/hospitals" }]}
      />
      <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 dark:border-gray-700 dark:bg-white/[0.03]">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">상세 화면 준비 중</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          현재 상세 조회 기능은 아직 구현되지 않았습니다. 잘못 연결된 템플릿 import는 제거했고,
          이후 실제 병의원 상세 API와 편집 흐름을 여기에 연결하면 됩니다.
        </p>
      </section>
    </div>
  );
}
