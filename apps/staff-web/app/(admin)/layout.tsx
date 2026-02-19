"use client";

import React, { ReactNode, useMemo } from "react";
import { Guard } from "@/components/guard";
import { getSession } from "@/lib/session";
import { buildStaffSidebarMenu } from "@/components/admin/sidebar-menu";
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

    const permissions = useMemo(() => session?.auth?.permissions ?? [], [session?.auth?.permissions]);
    const menuByActor = useMemo(() => buildStaffSidebarMenu(permissions), [permissions]);

    const mainContentMargin = isMobileOpen
        ? "ml-0"
        : isExpanded || isHovered
            ? "lg:ml-[290px]"
            : "lg:ml-[90px]";

    return (
        <div className="min-h-dvh bg-gray-50 dark:bg-gray-900 xl:flex">
            <AppSidebar menu={menuByActor} />
            <Backdrop />

            <div className={`flex flex-1 flex-col transition-all duration-300 ease-in-out ${mainContentMargin}`}>
                <AppHeader />
                <main className="flex-1 p-4 mx-auto w-full max-w-screen-2xl md:p-6">{children}</main>
            </div>
        </div>
    );
}