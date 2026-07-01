import React from "react";
import { getStaticRoutePermissions, type StaticAdminRoutePath } from "@/lib/common/routing/route-permissions";
import {
  type SidebarNavItem,
  Hospital,
  Database,
  Megaphone,
  Video,
  MessageSquareText,
  ShieldAlert,
  Bell,
  Users,
  Tags,
  LayoutDashboard,
  Store,
  Wallet,
} from "@beaulab/ui-admin";

type VisibilityRule = { requiredPermissions?: string[] };
type AppNavSubItem = { name: string; path: StaticAdminRoutePath; pro?: boolean; new?: boolean } & VisibilityRule;
type AppNavItem = {
  name: string;
  icon: React.ReactNode;
  path?: StaticAdminRoutePath;
  subItems?: AppNavSubItem[];
} & VisibilityRule;

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

function routeSubItem(item: { name: string; path: StaticAdminRoutePath }): AppNavSubItem {
  return {
    ...item,
    requiredPermissions: getStaticRoutePermissions(item.path),
  };
}

const hospitalDomainMenu: { main: AppNavItem[]; others: AppNavItem[] } = {
  main: [
    {
      icon: <Hospital className={iconClass} />,
      name: "병의원 관리",
      subItems: [
        routeSubItem({ name: "병의원", path: "/hospital-manage/hospitals" }),
        routeSubItem({ name: "의료진", path: "/hospital-manage/doctors" }),
        routeSubItem({ name: "입점신청", path: "/hospital-manage/hospital-entries" }),
      ],
    },
    {
      icon: <Database className={iconClass} />,
      name: "고객 DB 관리",
      subItems: [
        routeSubItem({ name: "이벤트 DB", path: "/customer-db-manage/events" }),
        routeSubItem({ name: "리얼모델 DB", path: "/customer-db-manage/real-models" }),
      ],
    },
    {
      icon: <Megaphone className={iconClass} />,
      name: "광고 관리",
      subItems: [routeSubItem({ name: "이벤트 관리", path: "/ads-manage/events" })],
    },
    {
      icon: <Video className={iconClass} />,
      name: "동영상 관리",
      subItems: [routeSubItem({ name: "동영상", path: "/video-manage/videos" })],
    },
    {
      icon: <MessageSquareText className={iconClass} />,
      name: "게시물 관리",
      subItems: [
        routeSubItem({ name: "성형후기", path: "/post-manage/surgery-reviews" }),
        routeSubItem({ name: "시술후기", path: "/post-manage/treatment-reviews" }),
        routeSubItem({ name: "병의원 평가", path: "/post-manage/hospital-evaluations" }),
        routeSubItem({ name: "토크", path: "/post-manage/talks" }),
      ],
    },
    {
      icon: <ShieldAlert className={iconClass} />,
      name: "신고게시물 관리",
      subItems: [
        routeSubItem({ name: "성형후기", path: "/reported-post-manage/surgery-reviews" }),
        routeSubItem({ name: "시술후기", path: "/reported-post-manage/treatment-reviews" }),
        routeSubItem({ name: "병의원 평가", path: "/reported-post-manage/hospital-evaluations" }),
        routeSubItem({ name: "토크", path: "/reported-post-manage/talks" }),
        routeSubItem({ name: "채팅", path: "/reported-post-manage/chats" }),
      ],
    },
  ],
  others: [],
};

const beautyDomainMenu: { main: AppNavItem[]; others: AppNavItem[] } = {
  main: [
    {
      icon: <LayoutDashboard className={iconClass} />,
      name: "뷰티 대시보드",
      subItems: [routeSubItem({ name: "대시보드", path: "/beauty-dashboard/dashboard" })],
    },
    {
      icon: <Store className={iconClass} />,
      name: "뷰티 관리",
      subItems: [
        routeSubItem({ name: "뷰티", path: "/beauty-shop-manage/beauties" }),
        routeSubItem({ name: "전문가", path: "/beauty-shop-manage/experts" }),
      ],
    },
    {
      icon: <Database className={iconClass} />,
      name: "고객 DB 관리",
      subItems: [routeSubItem({ name: "리얼모델 DB", path: "/beauty-customer-db-manage/real-models" })],
    },
    {
      icon: <Megaphone className={iconClass} />,
      name: "광고 관리",
      subItems: [
        routeSubItem({ name: "이벤트 관리", path: "/beauty-ads-manage/events" }),
        routeSubItem({ name: "상품 관리", path: "/beauty-ads-manage/products" }),
        routeSubItem({ name: "광고 캘린더", path: "/beauty-ads-manage/calendar" }),
      ],
    },
    {
      icon: <Wallet className={iconClass} />,
      name: "지갑 관리",
      subItems: [
        routeSubItem({ name: "뷰티 포인트", path: "/beauty-wallet-manage/beauties" }),
        routeSubItem({ name: "사용 내역", path: "/beauty-wallet-manage/usages" }),
      ],
    },
    {
      icon: <MessageSquareText className={iconClass} />,
      name: "게시물 관리",
      subItems: [
        routeSubItem({ name: "뷰티 후기", path: "/beauty-post-manage/beauty-reviews" }),
        routeSubItem({ name: "뷰티 게시글", path: "/beauty-post-manage/beauty-posts" }),
        routeSubItem({ name: "토크", path: "/beauty-post-manage/talks" }),
      ],
    },
    {
      icon: <ShieldAlert className={iconClass} />,
      name: "신고게시물 관리",
      subItems: [
        routeSubItem({ name: "신고 게시글", path: "/beauty-reported-content-manage/posts" }),
        routeSubItem({ name: "신고 댓글", path: "/beauty-reported-content-manage/comments" }),
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
      subItems: [routeSubItem({ name: "공지사항", path: "/notice-manage/notices" })],
    },
    {
      icon: <Users className={iconClass} />,
      name: "회원 관리",
      subItems: [routeSubItem({ name: "일반 회원", path: "/user-manage/users" })],
    },
    {
      icon: <Tags className={iconClass} />,
      name: "해시태그 관리",
      subItems: [routeSubItem({ name: "해시태그", path: "/category-hashtag-manage/hashtags" })],
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
    others: [...bundle.domainMenus[domain].others, ...bundle.commonMenu.main, ...bundle.commonMenu.others],
  };
}

export function resolveStaffSidebarDomain(pathname: string | null): StaffSidebarDomain | null {
  if (!pathname) {
    return null;
  }

  if (
    pathname.startsWith("/hospital-manage") ||
    pathname.startsWith("/customer-db-manage") ||
    pathname.startsWith("/ads-manage") ||
    pathname.startsWith("/video-manage") ||
    pathname.startsWith("/post-manage") ||
    pathname.startsWith("/reported-post-manage")
  ) {
    return "hospital";
  }

  if (
    pathname.startsWith("/beauty-dashboard") ||
    pathname.startsWith("/beauty-shop-manage") ||
    pathname.startsWith("/beauty-customer-db-manage") ||
    pathname.startsWith("/beauty-ads-manage") ||
    pathname.startsWith("/beauty-wallet-manage") ||
    pathname.startsWith("/beauty-post-manage") ||
    pathname.startsWith("/beauty-reported-content-manage")
  ) {
    return "beauty";
  }

  return null;
}
