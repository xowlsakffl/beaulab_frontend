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
    description: string;
    requiredPermissions?: string[];
    breadcrumbItems?: BreadcrumbItem[];
};

export const ADMIN_PAGE_DEFINITIONS: AdminPageDefinition[] = [
    {
        slug: ["beauty-dashboard"],
        title: "뷰티 대시보드",
        description: "뷰티 운영 현황을 확인하는 기본 대시보드 페이지입니다.",
        requiredPermissions: ["common.dashboard.show"],
    },
    {
        slug: ["beauties"],
        title: "뷰티샵",
        group: "뷰티샵 관리",
        description: "뷰티샵 목록, 상태, 검수 흐름을 관리하는 기본 페이지입니다.",
        requiredPermissions: ["beaulab.beauty.show"],
    },
    {
        slug: ["experts"],
        title: "뷰티전문가",
        group: "뷰티샵 관리",
        description: "뷰티전문가 목록과 운영 상태를 관리하는 기본 페이지입니다.",
        requiredPermissions: ["beaulab.expert.show"],
    },
    {
        slug: ["beauty-wallet", "beauties"],
        title: "뷰티샵 목록",
        group: "충전금",
        description: "뷰티샵별 충전금 현황과 사용 흐름을 확인하는 기본 페이지입니다.",
    },
    {
        slug: ["beauty-wallet", "usages"],
        title: "충전금 사용 목록",
        group: "충전금",
        description: "뷰티샵 충전금 사용 내역을 조회하는 기본 페이지입니다.",
    },
    {
        slug: ["beauty-customer-db", "remote-consultations"],
        title: "비대면상담 DB",
        group: "고객 DB 관리",
        description: "뷰티 비대면 상담 DB를 조회하고 관리하는 기본 페이지입니다.",
    },
    {
        slug: ["beauty-customer-db", "real-models"],
        title: "리얼모델 DB",
        group: "고객 DB 관리",
        description: "뷰티 리얼모델 지원 DB를 조회하는 기본 페이지입니다.",
    },
    {
        slug: ["beauty-ads", "events"],
        title: "이벤트 관리",
        group: "광고 관리",
        description: "뷰티 이벤트 등록과 운영을 위한 기본 페이지입니다.",
    },
    {
        slug: ["beauty-ads", "products"],
        title: "상품 등록 관리",
        group: "광고 관리",
        description: "뷰티 상품 등록과 승인 흐름을 위한 기본 페이지입니다.",
    },
    {
        slug: ["beauty-ads", "calendar"],
        title: "상품 캘린더",
        group: "광고 관리",
        description: "뷰티 상품 일정과 노출 캘린더를 확인하는 기본 페이지입니다.",
    },
    {
        slug: ["beauty-posts", "beauty-posts"],
        title: "뷰티 후기",
        group: "게시물 관리",
        description: "뷰티 후기 게시물을 조회하고 관리하는 기본 페이지입니다.",
    },
    {
        slug: ["beauty-posts", "beauty-reviews"],
        title: "뷰티 리뷰",
        group: "게시물 관리",
        description: "뷰티 리뷰 게시물을 조회하고 관리하는 기본 페이지입니다.",
    },
    {
        slug: ["beauty-posts", "talks"],
        title: "토크(커뮤니티)",
        group: "게시물 관리",
        description: "뷰티 토크 게시물을 조회하고 관리하는 기본 페이지입니다.",
    },
    {
        slug: ["beauty-reported-content", "posts"],
        title: "게시물",
        group: "신고컨텐츠 관리",
        description: "신고된 뷰티 게시물을 검토하는 기본 페이지입니다.",
    },
    {
        slug: ["beauty-reported-content", "comments"],
        title: "댓글",
        group: "신고컨텐츠 관리",
        description: "신고된 뷰티 댓글을 검토하는 기본 페이지입니다.",
    },
    {
        slug: ["doctors"],
        title: "의료진",
        group: "병의원 관리",
        description: "의료진 목록, 상태, 노출 정책을 관리하는 기본 페이지입니다.",
        requiredPermissions: ["beaulab.doctor.show"],
    },
    {
        slug: ["wallet", "deposits"],
        title: "입금/충전 관리",
        group: "충전금",
        description: "충전 요청 접수, 입금 확인, 상태 변경을 위한 기본 페이지입니다.",
    },
    {
        slug: ["wallet", "history"],
        title: "충전금 전체내역",
        group: "충전금",
        description: "충전금 전체 히스토리 조회를 위한 기본 페이지입니다.",
    },
    {
        slug: ["customer-db", "events"],
        title: "이벤트 DB",
        group: "고객 DB 관리",
        description: "이벤트 유입 고객 DB를 조회하고 관리하는 기본 페이지입니다.",
    },
    {
        slug: ["customer-db", "remote-consultations"],
        title: "비대면상담 DB",
        group: "고객 DB 관리",
        description: "비대면 상담 DB를 조회하고 관리하는 기본 페이지입니다.",
    },
    {
        slug: ["customer-db", "real-models"],
        title: "리얼모델 DB",
        group: "고객 DB 관리",
        description: "리얼모델 지원/신청 DB를 조회하는 기본 페이지입니다.",
    },
    {
        slug: ["ads", "events"],
        title: "이벤트 관리",
        group: "광고 관리",
        description: "광고성 이벤트 등록과 운영을 위한 기본 페이지입니다.",
    },
    {
        slug: ["ads", "products"],
        title: "상품 등록 관리",
        group: "광고 관리",
        description: "상품 등록과 승인 흐름을 위한 기본 페이지입니다.",
    },
    {
        slug: ["ads", "calendar"],
        title: "상품 캘린더",
        group: "광고 관리",
        description: "상품 일정과 노출 캘린더를 확인하는 기본 페이지입니다.",
    },
    {
        slug: ["videos"],
        title: "동영상 관리",
        description: "동영상 등록, 상태, 검수 흐름을 관리하는 기본 페이지입니다.",
        requiredPermissions: ["beaulab.video.show"],
    },
    {
        slug: ["posts", "surgery-reviews"],
        title: "성형후기",
        group: "게시물 관리",
        description: "성형후기 게시물을 조회하고 관리하는 기본 페이지입니다.",
    },
    {
        slug: ["posts", "hospital-reviews"],
        title: "병의원 리뷰",
        group: "게시물 관리",
        description: "병의원 리뷰 게시물을 조회하고 관리하는 기본 페이지입니다.",
    },
    {
        slug: ["posts", "talks"],
        title: "토크",
        group: "게시물 관리",
        description: "토크 게시물을 조회하고 관리하는 기본 페이지입니다.",
    },
    {
        slug: ["reported-content", "surgery-reviews"],
        title: "성형후기",
        group: "신고컨텐츠 관리",
        description: "신고된 성형후기 컨텐츠를 검토하는 기본 페이지입니다.",
    },
    {
        slug: ["reported-content", "hospital-reviews"],
        title: "병의원 리뷰",
        group: "신고컨텐츠 관리",
        description: "신고된 병의원 리뷰 컨텐츠를 검토하는 기본 페이지입니다.",
    },
    {
        slug: ["reported-content", "talks"],
        title: "토크",
        group: "신고컨텐츠 관리",
        description: "신고된 토크 컨텐츠를 검토하는 기본 페이지입니다.",
    },
    {
        slug: ["notices"],
        title: "공지사항",
        description: "공지사항 운영을 위한 기본 페이지입니다.",
    },
    {
        slug: ["faqs"],
        title: "자주하는 질문",
        group: "공지사항",
        description: "FAQ 관리용 기본 페이지입니다.",
    },
    {
        slug: ["inquiries"],
        title: "1:1문의",
        group: "공지사항",
        description: "1:1문의 확인과 응대를 위한 기본 페이지입니다.",
    },
    {
        slug: ["users"],
        title: "일반 회원",
        group: "회원 관리",
        description: "일반 회원 관리 기본 페이지입니다.",
    },
    {
        slug: ["agencies"],
        title: "대행사",
        group: "회원 관리",
        description: "대행사 계정 관리 기본 페이지입니다.",
    },
    {
        slug: ["categories"],
        title: "카테고리",
        group: "카테고리 / 해시태그 관리",
        description: "카테고리 관리 기본 페이지입니다.",
    },
    {
        slug: ["hashtags"],
        title: "해시태그",
        group: "카테고리 / 해시태그 관리",
        description: "해시태그 관리 기본 페이지입니다.",
    },
    {
        slug: ["content", "banners"],
        title: "배너",
        group: "컨텐츠",
        description: "배너 운영 기본 페이지입니다.",
    },
    {
        slug: ["content", "popups"],
        title: "팝업",
        group: "컨텐츠",
        description: "팝업 운영 기본 페이지입니다.",
    },
    {
        slug: ["content", "top-titles"],
        title: "상단타이틀 관리",
        group: "컨텐츠",
        description: "상단 타이틀 노출 관리 기본 페이지입니다.",
    },
    {
        slug: ["statistics"],
        title: "통계",
        description: "운영 통계 대시보드 기본 페이지입니다.",
    },
    {
        slug: ["settings", "harmful-words"],
        title: "유해성 단어 설정",
        group: "관리자 설정",
        description: "금칙어와 유해 표현 설정 기본 페이지입니다.",
    },
    {
        slug: ["settings", "nicknames"],
        title: "닉네임 관리",
        group: "관리자 설정",
        description: "닉네임 정책 관리 기본 페이지입니다.",
    },
    {
        slug: ["settings", "staff"],
        title: "직원 관리",
        group: "관리자 설정",
        description: "직원 계정과 권한 관리 기본 페이지입니다.",
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
        description: page.description,
    };
}

export function renderAdminPage(path: string) {
    const page = resolveAdminPageByPath(path);

    if (!page) notFound();

    const breadcrumbItems = page.breadcrumbItems
        ?? (page.group && page.group !== page.title ? [{ label: page.group }] : []);

    return (
        <div className="space-y-6">
            <PageBreadcrumb
                pageTitle={page.title}
                homeLabel="관리자"
                items={breadcrumbItems}
            />

            <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{page.title}</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{page.description}</p>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    현재는 라우트와 메뉴 구조만 먼저 고정한 기본 페이지입니다. 실제 목록, 상세, 등록, 수정 흐름은
                    각 도메인 요구사항에 맞춰 이 페이지에서 이어서 구현하면 됩니다.
                </p>
            </section>
        </div>
    );
}

export const ADMIN_PAGE_ROUTE_PERMISSIONS = ADMIN_PAGE_DEFINITIONS.map((page) => ({
    path: `/${page.slug.join("/")}`,
    requiredPermissions: page.requiredPermissions ?? ["common.access"],
}));
