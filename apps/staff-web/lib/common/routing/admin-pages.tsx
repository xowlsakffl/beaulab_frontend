import type { Metadata } from "next";
import { notFound } from "next/navigation";

export type AdminPageDefinition = {
  slug: string[];
  title: string;
  group?: string;
};

export const ADMIN_PAGE_DEFINITIONS: AdminPageDefinition[] = [
  {
    slug: ["hospital-manage", "hospitals"],
    title: "병의원",
    group: "병의원 관리",
  },
  {
    slug: ["hospital-manage", "doctors"],
    title: "의료진",
    group: "병의원 관리",
  },
  {
    slug: ["hospital-manage", "hospital-entries"],
    title: "입점신청",
    group: "병의원 관리",
  },
  {
    slug: ["customer-db-manage", "events"],
    title: "이벤트 DB",
    group: "고객 DB 관리",
  },
  {
    slug: ["customer-db-manage", "real-models"],
    title: "리얼모델 DB",
    group: "고객 DB 관리",
  },
  {
    slug: ["ads-manage", "events"],
    title: "이벤트 관리",
    group: "광고 관리",
  },
  {
    slug: ["video-manage", "videos"],
    title: "동영상 관리",
  },
  {
    slug: ["post-manage", "surgery-reviews"],
    title: "성형후기",
    group: "게시물 관리",
  },
  {
    slug: ["post-manage", "treatment-reviews"],
    title: "시술후기",
    group: "게시물 관리",
  },
  {
    slug: ["post-manage", "hospital-evaluations"],
    title: "병의원 평가",
    group: "게시물 관리",
  },
  {
    slug: ["post-manage", "talks"],
    title: "병원 토크",
    group: "게시물 관리",
  },
  {
    slug: ["reported-post-manage", "surgery-reviews"],
    title: "성형후기",
    group: "신고게시물 관리",
  },
  {
    slug: ["reported-post-manage", "treatment-reviews"],
    title: "시술후기",
    group: "신고게시물 관리",
  },
  {
    slug: ["reported-post-manage", "hospital-evaluations"],
    title: "병의원 평가",
    group: "신고게시물 관리",
  },
  {
    slug: ["reported-post-manage", "talks"],
    title: "토크",
    group: "신고게시물 관리",
  },
  {
    slug: ["reported-post-manage", "chats"],
    title: "채팅",
    group: "신고게시물 관리",
  },
  {
    slug: ["notice-manage", "notices"],
    title: "공지사항",
  },
  {
    slug: ["user-manage", "users"],
    title: "일반 회원",
    group: "회원 관리",
  },
  {
    slug: ["category-hashtag-manage", "hashtags"],
    title: "해시태그",
    group: "해시태그 관리",
  },
  {
    slug: ["admin-settings", "profile"],
    title: "내 프로필",
    group: "관리자 설정",
  },
  {
    slug: ["beauty-dashboard", "dashboard"],
    title: "대시보드",
    group: "뷰티 대시보드",
  },
  {
    slug: ["beauty-shop-manage", "beauties"],
    title: "뷰티",
    group: "뷰티 관리",
  },
  {
    slug: ["beauty-shop-manage", "experts"],
    title: "전문가",
    group: "뷰티 관리",
  },
  {
    slug: ["beauty-customer-db-manage", "real-models"],
    title: "리얼모델 DB",
    group: "고객 DB 관리",
  },
  {
    slug: ["beauty-ads-manage", "events"],
    title: "이벤트 관리",
    group: "광고 관리",
  },
  {
    slug: ["beauty-ads-manage", "products"],
    title: "상품 관리",
    group: "광고 관리",
  },
  {
    slug: ["beauty-ads-manage", "calendar"],
    title: "광고 캘린더",
    group: "광고 관리",
  },
  {
    slug: ["beauty-wallet-manage", "beauties"],
    title: "뷰티 포인트",
    group: "지갑 관리",
  },
  {
    slug: ["beauty-wallet-manage", "usages"],
    title: "사용 내역",
    group: "지갑 관리",
  },
  {
    slug: ["beauty-post-manage", "beauty-reviews"],
    title: "뷰티 후기",
    group: "게시물 관리",
  },
  {
    slug: ["beauty-post-manage", "beauty-posts"],
    title: "뷰티 게시글",
    group: "게시물 관리",
  },
  {
    slug: ["beauty-post-manage", "talks"],
    title: "토크",
    group: "게시물 관리",
  },
  {
    slug: ["beauty-reported-content-manage", "posts"],
    title: "신고 게시글",
    group: "신고게시물 관리",
  },
  {
    slug: ["beauty-reported-content-manage", "comments"],
    title: "신고 댓글",
    group: "신고게시물 관리",
  },
];

const adminPageDefinitionMap = new Map(ADMIN_PAGE_DEFINITIONS.map((page) => [page.slug.join("/"), page]));

export function resolveAdminPageByPath(path: string) {
  const normalizedPath = path.replace(/^\/+/, "");
  return adminPageDefinitionMap.get(normalizedPath) ?? null;
}

export function buildAdminPageMetadata(path: string): Metadata {
  const page = resolveAdminPageByPath(path);

  if (!page) {
    return {
      title: "페이지를 찾을 수 없음 | 뷰랩 관리자",
    };
  }

  return {
    title: `${page.title} | 뷰랩 관리자`,
  };
}

export function renderAdminPage(path: string) {
  const page = resolveAdminPageByPath(path);

  if (!page) notFound();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-800">{page.title}</h3>
      </section>
    </div>
  );
}
