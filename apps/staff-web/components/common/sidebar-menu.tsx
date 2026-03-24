import React from "react";
import {
    type SidebarNavItem,
    LayoutGrid,
    Hospital,
    Wallet,
    Database,
    Megaphone,
    Video,
    MessageSquareText,
    ShieldAlert,
    Bell,
    Users,
    Tags,
    Images,
    ChartColumn,
    Settings2,
} from "@beaulab/ui-admin";

type VisibilityRule = { requiredPermissions?: string[] };
type AppNavSubItem = { name: string; path: string; pro?: boolean; new?: boolean } & VisibilityRule;
type AppNavItem = { name: string; icon: React.ReactNode; path?: string; subItems?: AppNavSubItem[] } & VisibilityRule;

type SidebarMenu = {
    main: SidebarNavItem[];
    others: SidebarNavItem[];
};

export type StaffSidebarDomain = "hospital" | "beauty";

export type StaffSidebarMenuBundle = {
    domainMenus: Record<StaffSidebarDomain, SidebarMenu>;
    commonMenu: SidebarMenu;
};

export const STAFF_SIDEBAR_DOMAIN_OPTIONS: { key: StaffSidebarDomain; label: string }[] = [
    { key: "hospital", label: "병의원" },
    { key: "beauty", label: "뷰티" },
];

const iconClass = "w-5 h-5";

const hospitalDomainMenu: { main: AppNavItem[]; others: AppNavItem[] } = {
    main: [
        {
            icon: <LayoutGrid className={iconClass} />,
            name: "병의원 대시보드",
            path: "/",
            requiredPermissions: ["common.dashboard.show"],
        },
        {
            icon: <Hospital className={iconClass} />,
            name: "병의원 관리",
            subItems: [
                { name: "병의원", path: "/hospitals", requiredPermissions: ["beaulab.hospital.show"] },
                { name: "의료진", path: "/doctors", requiredPermissions: ["beaulab.doctor.show"] },
            ],
        },
        {
            icon: <Wallet className={iconClass} />,
            name: "충전금 관리",
            subItems: [
                { name: "입금/충전 관리", path: "/wallet/deposits", requiredPermissions: ["common.access"] },
                { name: "충전금 전체내역", path: "/wallet/history", requiredPermissions: ["common.access"] },
            ],
        },
        {
            icon: <Database className={iconClass} />,
            name: "고객 DB 관리",
            subItems: [
                { name: "이벤트 DB", path: "/customer-db/events", requiredPermissions: ["common.access"] },
                { name: "비대면상담 DB", path: "/customer-db/remote-consultations", requiredPermissions: ["common.access"] },
                { name: "리얼모델 DB", path: "/customer-db/real-models", requiredPermissions: ["common.access"] },
            ],
        },
        {
            icon: <Megaphone className={iconClass} />,
            name: "광고 관리",
            subItems: [
                { name: "이벤트 관리", path: "/ads/events", requiredPermissions: ["common.access"] },
                { name: "상품 등록 관리", path: "/ads/products", requiredPermissions: ["common.access"] },
                { name: "상품 캘린더", path: "/ads/calendar", requiredPermissions: ["common.access"] },
            ],
        },
        {
            icon: <Video className={iconClass} />,
            name: "동영상 관리",
            subItems: [{ name: "동영상", path: "/videos", requiredPermissions: ["beaulab.video.show"] }],
        },
        {
            icon: <MessageSquareText className={iconClass} />,
            name: "게시물 관리",
            subItems: [
                { name: "성형후기", path: "/posts/surgery-reviews", requiredPermissions: ["common.access"] },
                { name: "병의원 리뷰", path: "/posts/hospital-reviews", requiredPermissions: ["common.access"] },
                { name: "토크", path: "/posts/talks", requiredPermissions: ["common.access"] },
            ],
        },
        {
            icon: <ShieldAlert className={iconClass} />,
            name: "신고컨텐츠 관리",
            subItems: [
                { name: "성형후기", path: "/reported-content/surgery-reviews", requiredPermissions: ["common.access"] },
                { name: "병의원 리뷰", path: "/reported-content/hospital-reviews", requiredPermissions: ["common.access"] },
                { name: "토크", path: "/reported-content/talks", requiredPermissions: ["common.access"] },
            ],
        },
    ],
    others: [],
};

const beautyDomainMenu: { main: AppNavItem[]; others: AppNavItem[] } = {
    main: [
        {
            icon: <LayoutGrid className={iconClass} />,
            name: "뷰티 대시보드",
            path: "/beauty-dashboard",
            requiredPermissions: ["common.dashboard.show"],
        },
        {
            icon: <Hospital className={iconClass} />,
            name: "뷰티샵 관리",
            subItems: [
                { name: "뷰티샵", path: "/beauties", requiredPermissions: ["beaulab.beauty.show"] },
                { name: "뷰티전문가", path: "/experts", requiredPermissions: ["beaulab.expert.show"] },
            ],
        },
        {
            icon: <Wallet className={iconClass} />,
            name: "충전금 관리",
            subItems: [
                { name: "뷰티샵 목록", path: "/beauty-wallet/beauties", requiredPermissions: ["common.access"] },
                { name: "충전금 사용 목록", path: "/beauty-wallet/usages", requiredPermissions: ["common.access"] },
            ],
        },
        {
            icon: <Database className={iconClass} />,
            name: "고객 DB 관리",
            subItems: [
                { name: "비대면상담 DB", path: "/beauty-customer-db/remote-consultations", requiredPermissions: ["common.access"] },
                { name: "리얼모델 DB", path: "/beauty-customer-db/real-models", requiredPermissions: ["common.access"] },
            ],
        },
        {
            icon: <Megaphone className={iconClass} />,
            name: "광고 관리",
            subItems: [
                { name: "이벤트 관리", path: "/beauty-ads/events", requiredPermissions: ["common.access"] },
                { name: "상품 등록 관리", path: "/beauty-ads/products", requiredPermissions: ["common.access"] },
                { name: "상품 캘린더", path: "/beauty-ads/calendar", requiredPermissions: ["common.access"] },
            ],
        },
        {
            icon: <MessageSquareText className={iconClass} />,
            name: "게시물 관리",
            subItems: [
                { name: "뷰티 후기", path: "/beauty-posts/beauty-posts", requiredPermissions: ["common.access"] },
                { name: "뷰티 리뷰", path: "/beauty-posts/beauty-reviews", requiredPermissions: ["common.access"] },
                { name: "토크(커뮤니티)", path: "/beauty-posts/talks", requiredPermissions: ["common.access"] },
            ],
        },
        {
            icon: <ShieldAlert className={iconClass} />,
            name: "신고컨텐츠 관리",
            subItems: [
                { name: "게시물", path: "/beauty-reported-content/posts", requiredPermissions: ["common.access"] },
                { name: "댓글", path: "/beauty-reported-content/comments", requiredPermissions: ["common.access"] },
            ],
        },
    ],
    others: [],
};

const commonMenu: { main: AppNavItem[]; others: AppNavItem[] } = {
    main: [
        {
            icon: <Bell className={iconClass} />,
            name: "공지사항 관리",
            subItems: [
                { name: "공지사항", path: "/notices", requiredPermissions: ["common.access"] },
                { name: "자주하는 질문", path: "/faqs", requiredPermissions: ["common.access"] },
                { name: "1:1문의", path: "/inquiries", requiredPermissions: ["common.access"] },
            ],
        },
        {
            icon: <Users className={iconClass} />,
            name: "회원 관리",
            subItems: [
                { name: "일반 회원", path: "/users", requiredPermissions: ["common.access"] },
                { name: "대행사", path: "/agencies", requiredPermissions: ["common.access"] },
            ],
        },
        {
            icon: <Tags className={iconClass} />,
            name: "카테고리 / 해시태그 관리",
            subItems: [
                { name: "카테고리", path: "/categories", requiredPermissions: ["common.access"] },
                { name: "해시태그", path: "/hashtags", requiredPermissions: ["common.access"] },
            ],
        },
        {
            icon: <Images className={iconClass} />,
            name: "컨텐츠 관리",
            subItems: [
                { name: "배너", path: "/content/banners", requiredPermissions: ["common.access"] },
                { name: "팝업", path: "/content/popups", requiredPermissions: ["common.access"] },
                { name: "상단타이틀", path: "/content/top-titles", requiredPermissions: ["common.access"] },
            ],
        },
        {
            icon: <ChartColumn className={iconClass} />,
            name: "통계 관리",
            path: "/statistics",
            requiredPermissions: ["common.access"],
        },
        {
            icon: <Settings2 className={iconClass} />,
            name: "관리자 설정",
            subItems: [
                { name: "유해성 단어 설정", path: "/settings/harmful-words", requiredPermissions: ["common.access"] },
                { name: "닉네임 관리", path: "/settings/nicknames", requiredPermissions: ["common.access"] },
                { name: "직원 관리", path: "/settings/staff", requiredPermissions: ["common.access"] },
            ],
        },
    ],
    others: [],
};

function hasAnyPermission(requiredPermissions: string[] | undefined, permissions: string[]) {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    return requiredPermissions.some((permission) => permissions.includes(permission));
}

function toSidebarMenu(menu: { main: AppNavItem[]; others: AppNavItem[] }, permissions: string[]): SidebarMenu {
    const mapItems = (items: AppNavItem[]): SidebarNavItem[] => {
        const mappedItems: SidebarNavItem[] = [];

        items.forEach((item) => {
            if (!hasAnyPermission(item.requiredPermissions, permissions)) return;

            if (!item.subItems) {
                const { name, icon, path } = item;
                mappedItems.push({ name, icon, path });
                return;
            }

            const subItems = item.subItems
                .filter((subItem) => hasAnyPermission(subItem.requiredPermissions, permissions))
                .map(({ name, path, pro, new: isNew }) => ({ name, path, pro, new: isNew }));

            if (subItems.length === 0) return;

            const { name, icon, path } = item;
            mappedItems.push({ name, icon, path, subItems });
        });

        return mappedItems;
    };

    return {
        main: mapItems(menu.main),
        others: mapItems(menu.others),
    };
}

export function buildStaffSidebarMenus(permissions: string[]): StaffSidebarMenuBundle {
    return {
        domainMenus: {
            hospital: toSidebarMenu(hospitalDomainMenu, permissions),
            beauty: toSidebarMenu(beautyDomainMenu, permissions),
        },
        commonMenu: toSidebarMenu(commonMenu, permissions),
    };
}

export function mergeStaffSidebarMenu(bundle: StaffSidebarMenuBundle, domain: StaffSidebarDomain): SidebarMenu {
    return {
        main: bundle.domainMenus[domain].main,
        others: [
            ...bundle.domainMenus[domain].others,
            ...bundle.commonMenu.main,
            ...bundle.commonMenu.others,
        ],
    };
}

export function resolveStaffSidebarDomain(pathname: string | null): StaffSidebarDomain | null {
    if (!pathname) {
        return null;
    }

    if (
        pathname.startsWith("/beauties")
        || pathname.startsWith("/beauty-dashboard")
        || pathname.startsWith("/experts")
        || pathname.startsWith("/beauty-")
    ) {
        return "beauty";
    }

    if (
        pathname === "/" ||
        pathname.startsWith("/hospitals") ||
        pathname.startsWith("/doctors") ||
        pathname.startsWith("/videos")
    ) {
        return "hospital";
    }

    return null;
}
