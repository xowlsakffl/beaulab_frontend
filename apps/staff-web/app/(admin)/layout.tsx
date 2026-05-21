"use client";

import Image from "next/image";
import React, { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Guard } from "@/components/common/guard";
import { getSession, logout } from "@/lib/common/auth/session";
import {
    buildStaffSidebarMenus,
    mergeStaffSidebarMenu,
    resolveStaffSidebarDomain,
    STAFF_SIDEBAR_DOMAIN_OPTIONS,
    type StaffSidebarDomain,
} from "@/components/common/sidebar-menu";
import {
    AppHeader,
    AppSidebar,
    Backdrop,
    SidebarProvider,
} from "@beaulab/ui-admin";
import { resolveAdminPageByPath } from "@/lib/common/routing/admin-pages";
import { PageHeaderExtraProvider } from "@/lib/common/routing/page-header-extra";

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <Guard>
            <SidebarProvider>
                <AdminLayoutInner>{children}</AdminLayoutInner>
            </SidebarProvider>
        </Guard>
    );
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const session = React.useMemo(() => getSession(), []);
    const permissions = React.useMemo(() => session?.auth?.permissions ?? [], [session]);
    const sidebarMenus = React.useMemo(() => buildStaffSidebarMenus(permissions), [permissions]);
    const availableDomains = React.useMemo(
        () =>
            STAFF_SIDEBAR_DOMAIN_OPTIONS.filter(({ key }) => sidebarMenus.domainMenus[key].main.length > 0),
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
    const profile = session?.profile;
    const displayName = profile?.name || profile?.nickname || "뷰랩 관리자";
    const subtitle = profile?.nickname ? `아이디 ${profile.nickname}` : "스태프 관리자";
    const description = profile?.email ?? "권한 기반으로 접근이 제어됩니다.";
    const headerTitle = resolveHeaderPageTitle(pathname, activeDomain, menuByActor);
    const [pageHeaderExtra, setPageHeaderExtra] = React.useState<ReactNode | null>(null);

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

    React.useEffect(() => {
        setPageHeaderExtra(null);
    }, [pathname]);

    const sidebarTopContent = availableDomains.length > 1 ? (
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
                                isActive
                                    ? "bg-white text-[#302E3F] shadow-sm"
                                    : "text-white/65 hover:text-white"
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
            <div className="min-h-dvh bg-gray-50 xl:flex">
                <AppSidebar
                    menu={menuByActor}
                    topContent={sidebarTopContent}
                    sectionLabels={{
                        main: activeDomain === "hospital" ? "병의원메뉴" : "뷰티메뉴",
                        others: "공통메뉴",
                    }}
                    brand={{
                        href: "/",
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
                <Backdrop />

                <div className="min-w-0 flex flex-1 flex-col xl:ml-[290px]">
                    <AppHeader
                        mobileHomeHref="/"
                        mobileLogo={
                            <Image
                                src="/images/logo/logo.png"
                                alt="뷰랩"
                                width={36}
                                height={36}
                                className="h-9 w-9"
                                priority
                            />
                        }
                        pageTitle={headerTitle}
                        headerActions={pageHeaderExtra}
                        showSearch={false}
                        notifications={null}
                        userMenu={{
                            name: displayName,
                            subtitle,
                            description,
                            avatarSrc: "/images/user/owner.png",
                            actionItems: [{ label: "내 프로필", href: "/profile" }],
                            signOutItem: { label: "로그아웃", onClick: handleSignOut },
                        }}
                    />
                    <main className="min-w-0 w-full flex-1 px-2 py-4 md:px-4 md:py-5">{children}</main>
                </div>
            </div>
        </PageHeaderExtraProvider>
    );
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
