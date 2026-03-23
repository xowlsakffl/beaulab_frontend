"use client";

import Image from "next/image";
import React, { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Guard } from "@/components/common/guard";
import { getSession, logout } from "@/lib/common/auth/session";
import { buildStaffSidebarMenu } from "@/components/common/sidebar-menu";
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
    const session = getSession();
    const permissions = session?.auth?.permissions ?? [];
    const menuByActor = buildStaffSidebarMenu(permissions);
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

    return (
        <div className="min-h-dvh bg-gray-50 dark:bg-gray-900 xl:flex">
            <AppSidebar
                menu={menuByActor}
                sectionLabels={{ main: "관리 메뉴" }}
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
