"use client";

import Image from "next/image";
import React, { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Guard } from "@/components/common/guard";
import { api, isApiRequestCanceledError, NAVIGATION_BADGE_REFRESH_EVENT } from "@/lib/common/api";
import { getSession, logout } from "@/lib/common/auth/session";
import {
  normalizeNavigationBadges,
  type NavigationBadgeMap,
  type NavigationBadgesApiResponse,
} from "@/lib/common/navigation-badges";
import {
  buildStaffSidebarMenus,
  mergeStaffSidebarMenu,
  resolveStaffSidebarDomain,
  STAFF_SIDEBAR_DOMAIN_OPTIONS,
  type StaffSidebarDomain,
} from "@/components/common/sidebar-menu";
import { AppHeader, AppSidebar } from "@beaulab/ui-admin";
import { isApiSuccess } from "@beaulab/types";
import { resolveAdminPageByPath } from "@/lib/common/routing/admin-pages";
import { PageHeaderExtraProvider } from "@/lib/common/routing/page-header-extra";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <Guard>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Guard>
  );
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const session = React.useMemo(() => getSession(), []);
  const permissions = React.useMemo(() => session?.auth?.permissions ?? [], [session]);
  const [navigationBadges, setNavigationBadges] = React.useState<NavigationBadgeMap>({});
  const sidebarMenus = React.useMemo(
    () => buildStaffSidebarMenus(permissions, navigationBadges),
    [navigationBadges, permissions],
  );
  const availableDomains = React.useMemo(
    () => STAFF_SIDEBAR_DOMAIN_OPTIONS.filter(({ key }) => sidebarMenus.domainMenus[key].main.length > 0),
    [sidebarMenus],
  );
  const [activeDomain, setActiveDomain] = React.useState<StaffSidebarDomain>(() => {
    const resolvedDomain = resolveStaffSidebarDomain(pathname);
    if (resolvedDomain && sidebarMenus.domainMenus[resolvedDomain].main.length > 0) {
      return resolvedDomain;
    }

    return availableDomains[0]?.key ?? "hospital";
  });
  const menuByActor = React.useMemo(
    () => mergeStaffSidebarMenu(sidebarMenus, activeDomain),
    [activeDomain, sidebarMenus],
  );
  const brandHref = React.useMemo(
    () => resolveFirstSidebarPath(menuByActor) ?? "/admin-settings/profile",
    [menuByActor],
  );
  const profile = session?.profile;
  const displayName = profile?.name || profile?.nickname || "뷰랩 관리자";
  const subtitle = profile?.nickname ? `아이디 ${profile.nickname}` : "스태프 관리자";
  const description = profile?.email ?? "권한 기반으로 접근이 제어됩니다.";
  const headerTitle = resolveHeaderPageTitle(pathname, activeDomain, menuByActor);
  const [pageHeaderExtra, setPageHeaderExtra] = React.useState<ReactNode | null>(null);

  React.useEffect(() => {
    document.documentElement.classList.add("admin-shell-scroll-lock");
    document.body.classList.add("admin-shell-scroll-lock");

    return () => {
      document.documentElement.classList.remove("admin-shell-scroll-lock");
      document.body.classList.remove("admin-shell-scroll-lock");
    };
  }, []);

  React.useEffect(() => {
    let disposed = false;

    const fetchNavigationBadges = async () => {
      try {
        const response = await api.get<NavigationBadgesApiResponse>("/navigation-badges", undefined, {
          latestKey: "navigation-badges",
        });

        if (disposed) return;

        if (isApiSuccess(response)) {
          setNavigationBadges(normalizeNavigationBadges(response.data));
          return;
        }

        setNavigationBadges({});
      } catch (error) {
        if (isApiRequestCanceledError(error) || disposed) return;
        setNavigationBadges({});
      }
    };

    void fetchNavigationBadges();

    const intervalId = window.setInterval(fetchNavigationBadges, 30_000);
    window.addEventListener("focus", fetchNavigationBadges);
    window.addEventListener(NAVIGATION_BADGE_REFRESH_EVENT, fetchNavigationBadges);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", fetchNavigationBadges);
      window.removeEventListener(NAVIGATION_BADGE_REFRESH_EVENT, fetchNavigationBadges);
    };
  }, []);

  const handleSignOut = () => {
    logout();
    router.replace("/login");
    router.refresh();
  };

  React.useEffect(() => {
    if (availableDomains.length === 0) {
      return;
    }

    const resolvedDomain = resolveStaffSidebarDomain(pathname);
    if (resolvedDomain && sidebarMenus.domainMenus[resolvedDomain].main.length > 0) {
      setActiveDomain(resolvedDomain);
    }
  }, [availableDomains, pathname, sidebarMenus]);

  React.useEffect(() => {
    if (availableDomains.length === 0) {
      return;
    }

    if (!availableDomains.some(({ key }) => key === activeDomain)) {
      setActiveDomain(availableDomains[0].key);
    }
  }, [activeDomain, availableDomains]);

  const sidebarTopContent =
    availableDomains.length > 1 ? (
      <div className="rounded-xl bg-white/10 p-1">
        <div className="grid grid-cols-2 gap-1">
          {availableDomains.map((domain) => {
            const isActive = domain.key === activeDomain;

            return (
              <button
                key={domain.key}
                type="button"
                onClick={() => setActiveDomain(domain.key)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-white text-[#302E3F] shadow-sm" : "text-white/65 hover:text-white"
                }`}
              >
                {domain.label}
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <PageHeaderExtraProvider onChange={setPageHeaderExtra}>
      <div className="h-dvh w-full overflow-hidden bg-gray-50">
        <AppSidebar
          menu={menuByActor}
          topContent={sidebarTopContent}
          sectionLabels={{
            main: activeDomain === "hospital" ? "병의원메뉴" : "뷰티메뉴",
            others: activeDomain === "hospital" ? "병의원메뉴" : "뷰티메뉴",
          }}
          brand={{
            href: brandHref,
            expandedLogo: (
              <div className="flex items-center">
                <Image
                  src="/images/logo/board_logo_dark.png"
                  alt="뷰랩 관리자"
                  width={160}
                  height={36}
                  className="block h-auto"
                  priority
                />
              </div>
            ),
          }}
        />
        <div className="ml-[290px] flex h-dvh min-w-0 flex-col overflow-hidden">
          <div className="flex h-full min-w-0 flex-col overflow-x-auto overflow-y-hidden">
            <div className="flex h-full min-w-[1370px] flex-col">
              <AppHeader
                pageTitle={headerTitle}
                headerActions={pageHeaderExtra}
                showSearch={false}
                notifications={null}
                userMenu={{
                  name: displayName,
                  subtitle,
                  description,
                  avatarSrc: "/images/user/owner.png",
                  actionItems: [{ label: "내 프로필", href: "/admin-settings/profile" }],
                  signOutItem: { label: "로그아웃", onClick: handleSignOut },
                }}
              />
              <main className="mx-auto min-h-0 w-full max-w-[1800px] flex-1 overflow-y-auto px-4 py-5">{children}</main>
            </div>
          </div>
        </div>
      </div>
    </PageHeaderExtraProvider>
  );
}

function resolveFirstSidebarPath(menu: ReturnType<typeof mergeStaffSidebarMenu>) {
  const items = [...menu.main, ...(menu.others ?? [])];

  for (const item of items) {
    if (item.path) {
      return item.path;
    }

    const firstSubItem = item.subItems?.[0];
    if (firstSubItem?.path) {
      return firstSubItem.path;
    }
  }

  return null;
}

function resolveHeaderPageTitle(
  pathname: string,
  activeDomain: StaffSidebarDomain,
  menu: ReturnType<typeof mergeStaffSidebarMenu>,
) {
  if (pathname === "/") {
    return activeDomain === "beauty" ? "뷰티 대시보드" : "병의원 대시보드";
  }

  const menuMatches = [...menu.main, ...(menu.others ?? [])]
    .flatMap((item) => {
      if (item.path) {
        return [{ path: item.path, title: item.name }];
      }

      return (item.subItems ?? []).map((subItem) => ({
        path: subItem.path,
        title: subItem.name,
      }));
    })
    .filter(({ path }) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((left, right) => right.path.length - left.path.length);

  if (menuMatches[0]) {
    return menuMatches[0].title;
  }

  const segments = pathname.split("/").filter(Boolean);

  for (let length = segments.length; length > 0; length -= 1) {
    const definition = resolveAdminPageByPath(`/${segments.slice(0, length).join("/")}`);

    if (definition) {
      return definition.title;
    }
  }

  return "뷰랩 관리자";
}
