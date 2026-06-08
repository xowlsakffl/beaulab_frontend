import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageBreadcrumb } from "@beaulab/ui-admin";

type BreadcrumbItem = {
    label: string;
    href?: string;
};

export type AdminPageDefinition = {
    slug: string[];
    title: string;
    group?: string;
    breadcrumbItems?: BreadcrumbItem[];
};

export const ADMIN_PAGE_DEFINITIONS: AdminPageDefinition[] = [
    {
        slug: ["beauty-dashboard"],
        title: "뷰티 대시보드",
    },
    {
        slug: ["beauties"],
        title: "뷰티샵",
        group: "뷰티샵 관리",
    },
    {
        slug: ["experts"],
        title: "뷰티전문가",
        group: "뷰티샵 관리",
    },
    {
        slug: ["beauty-wallet", "beauties"],
        title: "뷰티샵 목록",
        group: "충전금",
    },
    {
        slug: ["beauty-wallet", "usages"],
        title: "충전금 사용 목록",
        group: "충전금",
    },
    {
        slug: ["beauty-customer-db", "remote-consultations"],
        title: "비대면상담 DB",
        group: "고객 DB 관리",
    },
    {
        slug: ["beauty-customer-db", "real-models"],
        title: "리얼모델 DB",
        group: "고객 DB 관리",
    },
    {
        slug: ["beauty-ads", "events"],
        title: "이벤트 관리",
        group: "광고 관리",
    },
    {
        slug: ["beauty-ads", "products"],
        title: "상품 등록 관리",
        group: "광고 관리",
    },
    {
        slug: ["beauty-ads", "calendar"],
        title: "상품 캘린더",
        group: "광고 관리",
    },
    {
        slug: ["beauty-posts", "beauty-posts"],
        title: "뷰티 후기",
        group: "게시물 관리",
    },
    {
        slug: ["beauty-posts", "beauty-reviews"],
        title: "뷰티 리뷰",
        group: "게시물 관리",
    },
    {
        slug: ["beauty-posts", "talks"],
        title: "토크(커뮤니티)",
        group: "게시물 관리",
    },
    {
        slug: ["beauty-reported-content", "posts"],
        title: "게시물",
        group: "신고게시물 관리",
    },
    {
        slug: ["beauty-reported-content", "comments"],
        title: "댓글",
        group: "신고컨텐츠 관리",
    },
    {
        slug: ["doctors"],
        title: "의료진",
        group: "병의원 관리",
    },
    {
        slug: ["wallet", "deposits"],
        title: "입금/충전 관리",
        group: "충전금",
    },
    {
        slug: ["wallet", "history"],
        title: "충전금 전체내역",
        group: "충전금",
    },
    {
        slug: ["customer-db", "events"],
        title: "이벤트 DB",
        group: "고객 DB 관리",
    },
    {
        slug: ["customer-db", "remote-consultations"],
        title: "비대면상담 DB",
        group: "고객 DB 관리",
    },
    {
        slug: ["customer-db", "real-models"],
        title: "리얼모델 DB",
        group: "고객 DB 관리",
    },
    {
        slug: ["ads", "events"],
        title: "이벤트 관리",
        group: "광고 관리",
    },
    {
        slug: ["ads", "products"],
        title: "상품 등록 관리",
        group: "광고 관리",
    },
    {
        slug: ["ads", "calendar"],
        title: "상품 캘린더",
        group: "광고 관리",
    },
    {
        slug: ["videos"],
        title: "동영상 관리",
    },
    {
        slug: ["reviews", "surgery-reviews"],
        title: "성형후기",
        group: "게시물 관리",
    },
    {
        slug: ["reviews", "treatment-reviews"],
        title: "시술후기",
        group: "게시물 관리",
    },
    {
        slug: ["reviews", "hospital-evaluations"],
        title: "병의원 평가",
        group: "게시물 관리",
    },
    {
        slug: ["talks"],
        title: "병원 토크",
        group: "게시물 관리",
    },
    {
        slug: ["reported-content", "surgery-reviews"],
        title: "성형후기",
        group: "신고게시물 관리",
    },
    {
        slug: ["reported-content", "treatment-reviews"],
        title: "시술후기",
        group: "신고게시물 관리",
    },
    {
        slug: ["reported-content", "hospital-evaluations"],
        title: "병의원 평가",
        group: "신고게시물 관리",
    },
    {
        slug: ["reported-content", "talks"],
        title: "토크",
        group: "신고게시물 관리",
    },
    {
        slug: ["reported-content", "chats"],
        title: "채팅",
        group: "신고게시물 관리",
    },
    {
        slug: ["notices"],
        title: "공지사항",
    },
    {
        slug: ["faqs"],
        title: "자주하는 질문",
        group: "공지사항",
    },
    {
        slug: ["inquiries"],
        title: "1:1문의",
        group: "공지사항",
    },
    {
        slug: ["users"],
        title: "일반 회원",
        group: "회원 관리",
    },
    {
        slug: ["categories"],
        title: "카테고리",
        group: "카테고리 / 해시태그 관리",
    },
    {
        slug: ["hashtags"],
        title: "해시태그",
        group: "카테고리 / 해시태그 관리",
    },
    {
        slug: ["content", "banners"],
        title: "배너",
        group: "컨텐츠",
    },
    {
        slug: ["content", "popups"],
        title: "팝업",
        group: "컨텐츠",
    },
    {
        slug: ["content", "top-titles"],
        title: "상단타이틀 관리",
        group: "컨텐츠",
    },
    {
        slug: ["statistics"],
        title: "통계",
    },
    {
        slug: ["settings", "harmful-words"],
        title: "유해성 단어 설정",
        group: "관리자 설정",
    },
    {
        slug: ["settings", "nicknames"],
        title: "닉네임 관리",
        group: "관리자 설정",
    },
    {
        slug: ["settings", "staff"],
        title: "직원 관리",
        group: "관리자 설정",
    },
];

const adminPageDefinitionMap = new Map(
    ADMIN_PAGE_DEFINITIONS.map((page) => [page.slug.join("/"), page]),
);

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
    const breadcrumbItems = page.breadcrumbItems
        ?? (page.group && page.group !== page.title ? [{ label: page.group }] : []);

    return (
        <div className="space-y-6">
            <div className="xl:hidden">
                <PageBreadcrumb
                    pageTitle={page.title}
                    homeLabel="관리자"
                    items={breadcrumbItems}
                />
            </div>

            <section className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-800">{page.title}</h3>
            </section>
        </div>
    );
}
