import type { Metadata } from "next";
import { notFound } from "next/navigation";

export type AdminPageDefinition = {
  slug: string[];
  title: string;
  group?: string;
};

export const ADMIN_PAGE_DEFINITIONS: AdminPageDefinition[] = [
  {
    slug: ["user-manage", "users"],
    title: "일반 회원",
    group: "회원",
  },
  {
    slug: ["hospital-manage", "hospitals"],
    title: "병의원",
    group: "병의원",
  },
  {
    slug: ["hospital-manage", "doctors"],
    title: "의료진",
    group: "병의원",
  },
  {
    slug: ["hospital-manage", "hospital-entries"],
    title: "입점신청",
    group: "병의원",
  },
  {
    slug: ["wallet-manage", "deposits"],
    title: "충전금 정산/이용 현황",
    group: "충전금",
  },
  {
    slug: ["wallet-manage", "hospitals"],
    title: "병의원 충전금 관리",
    group: "충전금",
  },
  {
    slug: ["wallet-manage", "history"],
    title: "충전금 내역",
    group: "충전금",
  },
  {
    slug: ["customer-db-manage", "events"],
    title: "이벤트 DB",
    group: "고객 DB",
  },
  {
    slug: ["customer-db-manage", "real-models"],
    title: "리얼모델 DB",
    group: "고객 DB",
  },
  {
    slug: ["ads-manage", "events"],
    title: "이벤트 관리",
    group: "이벤트/광고",
  },
  {
    slug: ["ads-manage", "event-ads"],
    title: "광고 관리",
    group: "이벤트/광고",
  },
  {
    slug: ["ads-manage", "calendar"],
    title: "광고 현황",
    group: "이벤트/광고",
  },
  {
    slug: ["ads-manage", "products"],
    title: "상품 관리",
    group: "이벤트/광고",
  },
  {
    slug: ["video-manage", "videos"],
    title: "동영상 관리",
    group: "동영상",
  },
  {
    slug: ["post-manage", "surgery-reviews"],
    title: "성형후기",
    group: "게시물",
  },
  {
    slug: ["post-manage", "treatment-reviews"],
    title: "쁘띠후기",
    group: "게시물",
  },
  {
    slug: ["post-manage", "talks"],
    title: "토크",
    group: "게시물",
  },
  {
    slug: ["post-manage", "hospital-evaluations"],
    title: "병의원평가",
    group: "게시물",
  },
  {
    slug: ["reported-post-manage", "surgery-reviews"],
    title: "성형후기",
    group: "신고게시물",
  },
  {
    slug: ["reported-post-manage", "treatment-reviews"],
    title: "쁘띠후기",
    group: "신고게시물",
  },
  {
    slug: ["reported-post-manage", "talks"],
    title: "토크",
    group: "신고게시물",
  },
  {
    slug: ["reported-post-manage", "hospital-evaluations"],
    title: "병의원평가",
    group: "신고게시물",
  },
  {
    slug: ["reported-post-manage", "chats"],
    title: "채팅",
    group: "신고게시물",
  },
  {
    slug: ["notice-manage", "notices"],
    title: "공지사항",
    group: "공지사항",
  },
  {
    slug: ["notice-manage", "hospital-notices"],
    title: "병의원대상 공지사항",
    group: "공지사항",
  },
  {
    slug: ["notice-manage", "faqs"],
    title: "자주하는 질문",
    group: "공지사항",
  },
  {
    slug: ["notice-manage", "inquiries"],
    title: "1:1문의",
    group: "공지사항",
  },
  {
    slug: ["content-manage", "banners"],
    title: "배너 / 팝업",
    group: "컨텐츠",
  },
  {
    slug: ["content-manage", "popups"],
    title: "팝업",
    group: "컨텐츠",
  },
  {
    slug: ["category-hashtag-manage", "categories"],
    title: "카테고리",
    group: "컨텐츠",
  },
  {
    slug: ["content-manage", "hashtags"],
    title: "해시태그",
    group: "컨텐츠",
  },
  {
    slug: ["content-manage", "top-titles"],
    title: "상단타이틀 관리",
    group: "컨텐츠",
  },
  {
    slug: ["statistics-manage", "statistics"],
    title: "통계",
  },
  {
    slug: ["admin-settings", "profile"],
    title: "내 프로필",
    group: "관리자 설정",
  },
  {
    slug: ["admin-settings", "harmful-words"],
    title: "유해성 단어 설정",
    group: "관리자 설정",
  },
  {
    slug: ["admin-settings", "nicknames"],
    title: "닉네임 관리",
    group: "관리자 설정",
  },
  {
    slug: ["admin-settings", "staff"],
    title: "직원 관리",
    group: "관리자 설정",
  },
  {
    slug: ["admin-settings", "event-display-positions"],
    title: "이벤트 노출위치 설정",
    group: "관리자 설정",
  },
  {
    slug: ["beauty-dashboard", "dashboard"],
    title: "대시보드",
    group: "뷰티 대시보드",
  },
  {
    slug: ["beauty-shop-manage", "beauties"],
    title: "뷰티샵",
    group: "뷰티샵",
  },
  {
    slug: ["beauty-shop-manage", "experts"],
    title: "뷰티전문가",
    group: "뷰티샵",
  },
  {
    slug: ["beauty-wallet-manage", "beauties"],
    title: "뷰티샵 목록",
    group: "충전금",
  },
  {
    slug: ["beauty-wallet-manage", "usages"],
    title: "충전금 사용 목록",
    group: "충전금",
  },
  {
    slug: ["beauty-customer-db-manage", "real-models"],
    title: "체험단 신청",
    group: "고객 DB",
  },
  {
    slug: ["beauty-ads-manage", "events"],
    title: "이벤트 관리",
    group: "광고",
  },
  {
    slug: ["beauty-ads-manage", "products"],
    title: "상품 등록 관리",
    group: "광고",
  },
  {
    slug: ["beauty-ads-manage", "calendar"],
    title: "상품 캘린더",
    group: "광고",
  },
  {
    slug: ["beauty-post-manage", "beauty-reviews"],
    title: "뷰티시술 후기",
    group: "게시물",
  },
  {
    slug: ["beauty-post-manage", "beauty-posts"],
    title: "뷰티샵 리뷰",
    group: "게시물",
  },
  {
    slug: ["beauty-post-manage", "talks"],
    title: "토크",
    group: "게시물",
  },
  {
    slug: ["beauty-reported-content-manage", "posts"],
    title: "뷰티시술 후기",
    group: "신고게시물",
  },
  {
    slug: ["beauty-reported-content-manage", "comments"],
    title: "뷰티샵 리뷰",
    group: "신고게시물",
  },
  {
    slug: ["beauty-notice-manage", "notices"],
    title: "공지사항",
    group: "공지사항",
  },
  {
    slug: ["beauty-notice-manage", "faqs"],
    title: "자주하는 질문",
    group: "공지사항",
  },
  {
    slug: ["beauty-notice-manage", "inquiries"],
    title: "1:1문의",
    group: "공지사항",
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
