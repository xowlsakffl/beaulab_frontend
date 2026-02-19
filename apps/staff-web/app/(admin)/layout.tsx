"use client";

import React, { ReactNode } from "react";
import { Guard } from "@/components/guard";
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

    const mainContentMargin = isMobileOpen
        ? "ml-0"
        : isExpanded || isHovered
            ? "lg:ml-[290px]"
            : "lg:ml-[90px]";

    return (
        <div className="min-h-dvh bg-gray-50 dark:bg-gray-900 xl:flex">
            {/* Sidebar */}
            <AppSidebar />

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
