import React from "react";
import {
    getStaticRoutePermissions,
    type StaticAdminRoutePath,
} from "@/lib/common/routing/route-permissions";
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
type AppNavSubItem = { name: string; path: StaticAdminRoutePath; pro?: boolean; new?: boolean } & VisibilityRule;
type AppNavItem = { name: string; icon: React.ReactNode; path?: StaticAdminRoutePath; subItems?: AppNavSubItem[] } & VisibilityRule;

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

function routeSubItem(item: Omit<AppNavSubItem, "requiredPermissions">): AppNavSubItem {
    return {
        ...item,
        requiredPermissions: getStaticRoutePermissions(item.path),
    };
}

function routeItem(item: Omit<AppNavItem, "requiredPermissions" | "subItems"> & { path: StaticAdminRoutePath }): AppNavItem {
    return {
        ...item,
        requiredPermissions: getStaticRoutePermissions(item.path),
    };
}

const hospitalDomainMenu: { main: AppNavItem[]; others: AppNavItem[] } = {
    main: [
        {
            ...routeItem({
                icon: <LayoutGrid className={iconClass} />,
                name: "병의원 대시보드",
                path: "/",
            }),
        },
        {
            icon: <Hospital className={iconClass} />,
            name: "병의원 관리",
            subItems: [
                routeSubItem({ name: "병의원", path: "/hospitals" }),
                routeSubItem({ name: "의료진", path: "/doctors" }),
            ],
        },
        {
            icon: <Wallet className={iconClass} />,
            name: "충전금 관리",
            subItems: [
                routeSubItem({ name: "입금/충전 관리", path: "/wallet/deposits" }),
                routeSubItem({ name: "충전금 전체내역", path: "/wallet/history" }),
            ],
        },
        {
            icon: <Database className={iconClass} />,
            name: "고객 DB 관리",
            subItems: [
                routeSubItem({ name: "이벤트 DB", path: "/customer-db/events" }),
                routeSubItem({ name: "비대면상담 DB", path: "/customer-db/remote-consultations" }),
                routeSubItem({ name: "리얼모델 DB", path: "/customer-db/real-models" }),
            ],
        },
        {
            icon: <Megaphone className={iconClass} />,
            name: "광고 관리",
            subItems: [
                routeSubItem({ name: "이벤트 관리", path: "/ads/events" }),
                routeSubItem({ name: "상품 등록 관리", path: "/ads/products" }),
                routeSubItem({ name: "상품 캘린더", path: "/ads/calendar" }),
            ],
        },
        {
            icon: <Video className={iconClass} />,
            name: "동영상 관리",
            subItems: [routeSubItem({ name: "동영상", path: "/videos" })],
        },
        {
            icon: <MessageSquareText className={iconClass} />,
            name: "게시물 관리",
            subItems: [
                routeSubItem({ name: "성형후기", path: "/posts/surgery-reviews" }),
                routeSubItem({ name: "병의원 리뷰", path: "/posts/hospital-reviews" }),
                routeSubItem({ name: "토크", path: "/posts/talks" }),
            ],
        },
        {
            icon: <ShieldAlert className={iconClass} />,
            name: "신고컨텐츠 관리",
            subItems: [
                routeSubItem({ name: "성형후기", path: "/reported-content/surgery-reviews" }),
                routeSubItem({ name: "병의원 리뷰", path: "/reported-content/hospital-reviews" }),
                routeSubItem({ name: "토크", path: "/reported-content/talks" }),
            ],
        },
    ],
    others: [],
};

const beautyDomainMenu: { main: AppNavItem[]; others: AppNavItem[] } = {
    main: [
        {
            ...routeItem({
                icon: <LayoutGrid className={iconClass} />,
                name: "뷰티 대시보드",
                path: "/beauty-dashboard",
            }),
        },
        {
            icon: <Hospital className={iconClass} />,
            name: "뷰티샵 관리",
            subItems: [
                routeSubItem({ name: "뷰티샵", path: "/beauties" }),
                routeSubItem({ name: "뷰티전문가", path: "/experts" }),
            ],
        },
        {
            icon: <Wallet className={iconClass} />,
            name: "충전금 관리",
            subItems: [
                routeSubItem({ name: "뷰티샵 목록", path: "/beauty-wallet/beauties" }),
                routeSubItem({ name: "충전금 사용 목록", path: "/beauty-wallet/usages" }),
            ],
        },
        {
            icon: <Database className={iconClass} />,
            name: "고객 DB 관리",
            subItems: [
                routeSubItem({ name: "비대면상담 DB", path: "/beauty-customer-db/remote-consultations" }),
                routeSubItem({ name: "리얼모델 DB", path: "/beauty-customer-db/real-models" }),
            ],
        },
        {
            icon: <Megaphone className={iconClass} />,
            name: "광고 관리",
            subItems: [
                routeSubItem({ name: "이벤트 관리", path: "/beauty-ads/events" }),
                routeSubItem({ name: "상품 등록 관리", path: "/beauty-ads/products" }),
                routeSubItem({ name: "상품 캘린더", path: "/beauty-ads/calendar" }),
            ],
        },
        {
            icon: <MessageSquareText className={iconClass} />,
            name: "게시물 관리",
            subItems: [
                routeSubItem({ name: "뷰티 후기", path: "/beauty-posts/beauty-posts" }),
                routeSubItem({ name: "뷰티 리뷰", path: "/beauty-posts/beauty-reviews" }),
                routeSubItem({ name: "토크(커뮤니티)", path: "/beauty-posts/talks" }),
            ],
        },
        {
            icon: <ShieldAlert className={iconClass} />,
            name: "신고컨텐츠 관리",
            subItems: [
                routeSubItem({ name: "게시물", path: "/beauty-reported-content/posts" }),
                routeSubItem({ name: "댓글", path: "/beauty-reported-content/comments" }),
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
                routeSubItem({ name: "공지사항", path: "/notices" }),
                routeSubItem({ name: "자주하는 질문", path: "/faqs" }),
                routeSubItem({ name: "1:1문의", path: "/inquiries" }),
            ],
        },
        {
            icon: <Users className={iconClass} />,
            name: "회원 관리",
            subItems: [
                routeSubItem({ name: "일반 회원", path: "/users" }),
                routeSubItem({ name: "대행사", path: "/agencies" }),
            ],
        },
        {
            icon: <Tags className={iconClass} />,
            name: "카테고리 / 해시태그 관리",
            subItems: [
                routeSubItem({ name: "카테고리", path: "/categories" }),
                routeSubItem({ name: "해시태그", path: "/hashtags" }),
            ],
        },
        {
            icon: <Images className={iconClass} />,
            name: "컨텐츠 관리",
            subItems: [
                routeSubItem({ name: "배너", path: "/content/banners" }),
                routeSubItem({ name: "팝업", path: "/content/popups" }),
                routeSubItem({ name: "상단타이틀", path: "/content/top-titles" }),
            ],
        },
        {
            ...routeItem({
                icon: <ChartColumn className={iconClass} />,
                name: "통계 관리",
                path: "/statistics",
            }),
        },
        {
            icon: <Settings2 className={iconClass} />,
            name: "관리자 설정",
            subItems: [
                routeSubItem({ name: "유해성 단어 설정", path: "/settings/harmful-words" }),
                routeSubItem({ name: "닉네임 관리", path: "/settings/nicknames" }),
                routeSubItem({ name: "직원 관리", path: "/settings/staff" }),
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
