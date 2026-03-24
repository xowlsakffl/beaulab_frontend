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
    ThemeProvider,
    useSidebar,
} from "@beaulab/ui-admin";

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <Guard>
            <ThemeProvider storageKey="beaulab.staff.theme">
                <SidebarProvider>
                    <AdminLayoutInner>{children}</AdminLayoutInner>
                </SidebarProvider>
            </ThemeProvider>
        </Guard>
    );
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
    const { isExpanded, isHovered, isMobileOpen } = useSidebar();
    const router = useRouter();
    const pathname = usePathname();
    const session = React.useMemo(() => getSession(), []);
    const permissions = session?.auth?.permissions ?? [];
    const permissionsSignature = React.useMemo(
        () => [...permissions].sort().join("|"),
        [permissions],
    );
    const sidebarMenus = React.useMemo(() => buildStaffSidebarMenus(permissions), [permissionsSignature]);
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

    const mainContentMargin = isMobileOpen
        ? "ml-0"
        : isExpanded || isHovered
            ? "xl:ml-[290px]"
            : "xl:ml-[90px]";

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

    const sidebarTopContent = availableDomains.length > 1 ? (
        <div className="rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
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
                                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
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
        <div className="min-h-dvh bg-gray-50 dark:bg-gray-900 xl:flex">
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
                                src="/images/logo/board_logo.png"
                                alt="뷰랩 관리자"
                                width={160}
                                height={36}
                                className="block h-auto dark:hidden"
                                priority
                            />
                            <Image
                                src="/images/logo/board_logo_dark.png"
                                alt="뷰랩 관리자"
                                width={160}
                                height={36}
                                className="hidden h-auto dark:block"
                                priority
                            />
                        </div>
                    ),
                    collapsedLogo: (
                        <Image
                            src="/images/logo/logo.png"
                            alt="뷰랩"
                            width={36}
                            height={36}
                            className="h-9 w-9"
                            priority
                        />
                    ),
                }}
            />
            <Backdrop />

            <div className={`flex flex-1 flex-col transition-all duration-300 ease-in-out ${mainContentMargin}`}>
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
                <main className="flex-1 p-4 mx-auto w-full max-w-screen-2xl md:p-6">{children}</main>
            </div>
        </div>
    );
}
