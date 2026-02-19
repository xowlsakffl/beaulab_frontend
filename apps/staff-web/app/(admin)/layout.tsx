"use client";

import React, { ReactNode } from "react";
import { Guard } from "@/components/guard";
import { getSession } from "@/lib/session";
import {
    AppHeader,
    AppSidebar,
    Backdrop,
    SidebarProvider,
    ThemeProvider,
    useSidebar,
    type SidebarNavItem,
    LayoutGrid,
    UserRound,
    CalendarDays,
    List,
    Table,
    FileText,
    PieChart,
    Box,
    Plug,
} from "@beaulab/ui-admin";

interface AdminLayoutProps {
    children: ReactNode;
}

const iconClass = "w-5 h-5";

const staffMenu: { main: SidebarNavItem[]; others: SidebarNavItem[] } = {
    main: [
        {
            icon: <LayoutGrid className={iconClass} />,
            name: "대시보드",
            path: "/",
            roles: ["staff"],
        },
        {
            icon: <CalendarDays className={iconClass} />,
            name: "예약 캘린더",
            path: "/calendar",
            roles: ["staff"],
            permissions: ["reservation.read"],
        },
        {
            icon: <UserRound className={iconClass} />,
            name: "내 프로필",
            path: "/profile",
            roles: ["staff"],
        },
        {
            name: "운영",
            icon: <List className={iconClass} />,
            roles: ["staff"],
            subItems: [
                { name: "Form Elements", path: "/form-elements", permissions: ["content.manage"] },
                { name: "Basic Tables", path: "/basic-tables", permissions: ["analytics.read"] },
            ],
        },
    ],
    others: [
        {
            icon: <FileText className={iconClass} />,
            name: "페이지",
            roles: ["staff"],
            subItems: [
                { name: "Blank Page", path: "/blank", permissions: ["page.read"] },
                { name: "404 Error", path: "/error-404" },
            ],
        },
    ],
};

const partnerMenu: { main: SidebarNavItem[]; others: SidebarNavItem[] } = {
    main: [
        {
            icon: <LayoutGrid className={iconClass} />,
            name: "파트너 대시보드",
            path: "/",
            roles: ["partner"],
        },
        {
            icon: <Table className={iconClass} />,
            name: "주문 관리",
            path: "/basic-tables",
            roles: ["partner"],
            permissions: ["order.read"],
        },
        {
            icon: <UserRound className={iconClass} />,
            name: "파트너 정보",
            path: "/profile",
            roles: ["partner"],
        },
    ],
    others: [
        {
            icon: <PieChart className={iconClass} />,
            name: "리포트",
            roles: ["partner"],
            subItems: [
                { name: "Line Chart", path: "/line-chart", permissions: ["report.read"] },
                { name: "Bar Chart", path: "/bar-chart", permissions: ["report.read"] },
            ],
        },
        {
            icon: <Box className={iconClass} />,
            name: "파트너 자산",
            roles: ["partner"],
            subItems: [
                { name: "Images", path: "/images", permissions: ["asset.read"] },
                { name: "Videos", path: "/videos", permissions: ["asset.read"] },
            ],
        },
        {
            icon: <Plug className={iconClass} />,
            name: "인증",
            roles: ["partner"],
            subItems: [
                { name: "Sign In", path: "/signin" },
                { name: "Sign Up", path: "/signup" },
            ],
        },
    ],
};

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <Guard>
            <ThemeProvider>
                <SidebarProvider>
                    <AdminLayoutInner>{children}</AdminLayoutInner>
                </SidebarProvider>
            </ThemeProvider>
        </Guard>
    );
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
    const { isExpanded, isHovered, isMobileOpen } = useSidebar();
    const session = getSession();

    const menuByActor = session?.actor === "partner" ? partnerMenu : staffMenu;

    const mainContentMargin = isMobileOpen
        ? "ml-0"
        : isExpanded || isHovered
            ? "lg:ml-[290px]"
            : "lg:ml-[90px]";

    return (
        <div className="min-h-dvh bg-gray-50 dark:bg-gray-900 xl:flex">
            {/* Sidebar */}
            <AppSidebar actor={session?.actor} auth={session?.auth} menu={menuByActor} />

            {/* Mobile overlay */}
            <Backdrop />

            {/* Main Area */}
            <div
                className={`flex flex-1 flex-col transition-all duration-300 ease-in-out ${mainContentMargin}`}
            >
                <AppHeader />

                <main className="flex-1 p-4 mx-auto w-full max-w-screen-2xl md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
