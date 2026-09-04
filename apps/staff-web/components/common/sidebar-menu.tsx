import React from "react";
import { getStaticRoutePermissions, type StaticAdminRoutePath } from "@/lib/common/routing/route-permissions";
import type { NavigationBadgeMap } from "@/lib/common/navigation-badges";
import {
  type SidebarNavItem,
  BarChart3,
  Bell,
  Database,
  Hospital,
  Megaphone,
  MessageSquareText,
  Settings,
  SlidersHorizontal,
  ShieldAlert,
  Store,
  Tags,
  Users,
  Video,
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

function routeItem(item: { name: string; path: StaticAdminRoutePath; icon: React.ReactNode }): AppNavItem {
  return {
    ...item,
    requiredPermissions: getStaticRoutePermissions(item.path),
  };
}

const hospitalDomainMenu: { main: AppNavItem[]; others: AppNavItem[] } = {
  main: [
    {
      icon: <Hospital className={iconClass} />,
      name: "병의원",
      subItems: [
        routeSubItem({ name: "병의원", path: "/hospital-manage/hospitals" }),
        routeSubItem({ name: "의료진", path: "/hospital-manage/doctors" }),
        routeSubItem({ name: "입점신청", path: "/hospital-manage/hospital-entries" }),
      ],
    },
    {
      icon: <Wallet className={iconClass} />,
      name: "충전금",
      subItems: [
        routeSubItem({ name: "충전금 현황", path: "/wallet-manage/deposits" }),
        routeSubItem({ name: "충전금 내역", path: "/wallet-manage/history" }),
        routeSubItem({ name: "병의원 충전금 관리", path: "/wallet-manage/hospitals" }),
      ],
    },
    {
      icon: <Database className={iconClass} />,
      name: "고객 DB",
      subItems: [
        routeSubItem({ name: "이벤트 DB", path: "/customer-db-manage/events" }),
        routeSubItem({ name: "리얼모델 DB", path: "/customer-db-manage/real-models" }),
      ],
    },
    {
      icon: <Megaphone className={iconClass} />,
      name: "이벤트/광고",
      subItems: [
        routeSubItem({ name: "이벤트 관리", path: "/ads-manage/events" }),
        routeSubItem({ name: "광고 관리", path: "/ads-manage/event-ads" }),
        routeSubItem({ name: "광고 현황", path: "/ads-manage/calendar" }),
      ],
    },
    {
      icon: <Video className={iconClass} />,
      name: "동영상",
      subItems: [
        routeSubItem({ name: "영상 등록관리", path: "/video-manage/videos" }),
        routeSubItem({ name: "영상 동의여부", path: "/video-manage/consents" }),
      ],
    },
    {
      icon: <MessageSquareText className={iconClass} />,
      name: "게시물",
      subItems: [
        routeSubItem({ name: "성형후기", path: "/post-manage/surgery-reviews" }),
        routeSubItem({ name: "쁘띠후기", path: "/post-manage/treatment-reviews" }),
        routeSubItem({ name: "토크", path: "/post-manage/talks" }),
        routeSubItem({ name: "병의원평가", path: "/post-manage/hospital-evaluations" }),
      ],
    },
    {
      icon: <ShieldAlert className={iconClass} />,
      name: "신고게시물",
      subItems: [
        routeSubItem({ name: "성형후기", path: "/reported-post-manage/surgery-reviews" }),
        routeSubItem({ name: "쁘띠후기", path: "/reported-post-manage/treatment-reviews" }),
        routeSubItem({ name: "토크", path: "/reported-post-manage/talks" }),
        routeSubItem({ name: "병의원평가", path: "/reported-post-manage/hospital-evaluations" }),
        routeSubItem({ name: "채팅", path: "/reported-post-manage/chats" }),
      ],
    },
  ],
  others: [
    {
      icon: <Users className={iconClass} />,
      name: "회원",
      subItems: [routeSubItem({ name: "일반 회원", path: "/user-manage/users" })],
    },
    {
      icon: <Bell className={iconClass} />,
      name: "공지사항",
      subItems: [routeSubItem({ name: "전체공지", path: "/notice-manage/notices" })],
    },
    {
      icon: <Tags className={iconClass} />,
      name: "프로모션 상품",
      subItems: [
        routeSubItem({ name: "병의원", path: "/promotion-manage/hospitals" }),
        routeSubItem({ name: "일반회원", path: "/promotion-manage/users" }),
      ],
    },
    {
      icon: <SlidersHorizontal className={iconClass} />,
      name: "이벤트 노출설정",
      subItems: [
        routeSubItem({ name: "기획전", path: "/content-manage/exhibitions" }),
        routeSubItem({ name: "배너", path: "/content-manage/banners" }),
        routeSubItem({ name: "팝업", path: "/content-manage/popups" }),
        routeSubItem({ name: "이벤트", path: "/admin-settings/event-display-positions" }),
        routeSubItem({ name: "동영상", path: "/content-manage/videos" }),
      ],
    },
    routeItem({
      icon: <BarChart3 className={iconClass} />,
      name: "통계",
      path: "/statistics-manage/statistics",
    }),
    {
      icon: <Settings className={iconClass} />,
      name: "운영 관리",
      subItems: [
        routeSubItem({ name: "직원 계정 관리", path: "/admin-settings/staff" }),
        routeSubItem({ name: "DB 단가비율 설정", path: "/admin-settings/db-pricing" }),
        routeSubItem({ name: "광고비율 설정", path: "/admin-settings/ad-pricing" }),
      ],
    },
    {
      icon: <Settings className={iconClass} />,
      name: "정책 설정",
      subItems: [
        routeSubItem({ name: "카테고리", path: "/category-hashtag-manage/categories" }),
        routeSubItem({ name: "상단타이틀", path: "/content-manage/top-titles" }),
        routeSubItem({ name: "금지어 설정", path: "/admin-settings/harmful-words" }),
        routeSubItem({ name: "자동 닉네임 설정", path: "/admin-settings/nicknames" }),
      ],
    },
  ],
};

const beautyDomainMenu: { main: AppNavItem[]; others: AppNavItem[] } = {
  main: [
    {
      icon: <Store className={iconClass} />,
      name: "뷰티샵",
      subItems: [
        routeSubItem({ name: "뷰티샵", path: "/beauty-shop-manage/beauties" }),
        routeSubItem({ name: "뷰티전문가", path: "/beauty-shop-manage/experts" }),
      ],
    },
    {
      icon: <Wallet className={iconClass} />,
      name: "충전금",
      subItems: [
        routeSubItem({ name: "뷰티샵 목록", path: "/beauty-wallet-manage/beauties" }),
        routeSubItem({ name: "충전금 사용 목록", path: "/beauty-wallet-manage/usages" }),
      ],
    },
    {
      icon: <Database className={iconClass} />,
      name: "고객 DB",
      subItems: [routeSubItem({ name: "체험단 신청", path: "/beauty-customer-db-manage/real-models" })],
    },
    {
      icon: <Megaphone className={iconClass} />,
      name: "광고",
      subItems: [
        routeSubItem({ name: "이벤트 관리", path: "/beauty-ads-manage/events" }),
        routeSubItem({ name: "상품 등록 관리", path: "/beauty-ads-manage/products" }),
        routeSubItem({ name: "상품 캘린더", path: "/beauty-ads-manage/calendar" }),
      ],
    },
    {
      icon: <MessageSquareText className={iconClass} />,
      name: "게시물",
      subItems: [
        routeSubItem({ name: "뷰티시술 후기", path: "/beauty-post-manage/beauty-reviews" }),
        routeSubItem({ name: "뷰티샵 리뷰", path: "/beauty-post-manage/beauty-posts" }),
      ],
    },
    {
      icon: <ShieldAlert className={iconClass} />,
      name: "신고게시물",
      subItems: [
        routeSubItem({ name: "뷰티시술 후기", path: "/beauty-reported-content-manage/posts" }),
        routeSubItem({ name: "뷰티샵 리뷰", path: "/beauty-reported-content-manage/comments" }),
      ],
    },
    {
      icon: <Tags className={iconClass} />,
      name: "프로모션 상품",
      subItems: [routeSubItem({ name: "뷰티샵", path: "/beauty-promotion-manage/beauties" })],
    },
  ],
  others: [],
};

function hasAnyPermission(requiredPermissions: string[] | undefined, permissions: string[]) {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  return requiredPermissions.some((permission) => permissions.includes(permission));
}

function hasNavigationBadge(path: string | undefined, badges: NavigationBadgeMap) {
  if (!path) return false;
  return Boolean(badges[path]?.has_new);
}

function toSidebarMenu(
  menu: { main: AppNavItem[]; others: AppNavItem[] },
  permissions: string[],
  badges: NavigationBadgeMap,
): SidebarMenu {
  const mapItems = (items: AppNavItem[]): SidebarNavItem[] => {
    const mappedItems: SidebarNavItem[] = [];

    items.forEach((item) => {
      if (!hasAnyPermission(item.requiredPermissions, permissions)) return;

      if (!item.subItems) {
        const { name, icon, path } = item;
        mappedItems.push({ name, icon, path, new: hasNavigationBadge(path, badges) });
        return;
      }

      const subItems = item.subItems
        .filter((subItem) => hasAnyPermission(subItem.requiredPermissions, permissions))
        .map(({ name, path, pro, new: isNew }) => ({
          name,
          path,
          pro,
          new: isNew || hasNavigationBadge(path, badges),
        }));

      if (subItems.length === 0) return;

      const { name, icon, path } = item;
      mappedItems.push({ name, icon, path, subItems, new: subItems.some((subItem) => subItem.new) });
    });

    return mappedItems;
  };

  return {
    main: mapItems(menu.main),
    others: mapItems(menu.others),
  };
}

export function buildStaffSidebarMenus(permissions: string[], badges: NavigationBadgeMap = {}): StaffSidebarMenuBundle {
  return {
    domainMenus: {
      hospital: toSidebarMenu(hospitalDomainMenu, permissions, badges),
      beauty: toSidebarMenu(beautyDomainMenu, permissions, badges),
    },
  };
}

export function mergeStaffSidebarMenu(bundle: StaffSidebarMenuBundle, domain: StaffSidebarDomain): SidebarMenu {
  return bundle.domainMenus[domain];
}

export function hasStaffSidebarItems(menu: SidebarMenu): boolean {
  return menu.main.length > 0 || menu.others.length > 0;
}

export function resolveStaffSidebarDomain(pathname: string | null): StaffSidebarDomain | null {
  if (!pathname) {
    return null;
  }

  if (
    pathname.startsWith("/beauty-shop-manage") ||
    pathname.startsWith("/beauty-customer-db-manage") ||
    pathname.startsWith("/beauty-ads-manage") ||
    pathname.startsWith("/beauty-wallet-manage") ||
    pathname.startsWith("/beauty-post-manage") ||
    pathname.startsWith("/beauty-reported-content-manage") ||
    pathname.startsWith("/beauty-promotion-manage") ||
    pathname.startsWith("/beauty-notice-manage")
  ) {
    return "beauty";
  }

  if (
    pathname.startsWith("/user-manage") ||
    pathname.startsWith("/hospital-manage") ||
    pathname.startsWith("/wallet-manage") ||
    pathname.startsWith("/customer-db-manage") ||
    pathname.startsWith("/ads-manage") ||
    pathname.startsWith("/video-manage") ||
    pathname.startsWith("/post-manage") ||
    pathname.startsWith("/reported-post-manage") ||
    pathname.startsWith("/notice-manage") ||
    pathname.startsWith("/promotion-manage") ||
    pathname.startsWith("/content-manage") ||
    pathname.startsWith("/category-hashtag-manage") ||
    pathname.startsWith("/statistics-manage") ||
    pathname.startsWith("/admin-settings")
  ) {
    return "hospital";
  }

  return null;
}
