"use client";

import React from "react";
import {
    AppHeader,
    AppSidebar,
    Backdrop,
    SidebarProvider,
    ThemeProvider,
    useSidebar,
} from "@beaulab/ui-admin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <SidebarProvider>
                <AdminLayoutInner>{children}</AdminLayoutInner>
            </SidebarProvider>
        </ThemeProvider>
    );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {

    const { isExpanded, isHovered, isMobileOpen } = useSidebar();

    const mainContentMargin = isMobileOpen
        ? "ml-0"
        : isExpanded || isHovered
            ? "lg:ml-[290px]"
            : "lg:ml-[90px]";

    return (
        <div className="min-h-screen xl:flex">
            <AppSidebar />
            {/*<Backdrop />*/}
            <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
                {/*<AppHeader />*/}
                <div className="p-4 mx-auto max-w-screen-2xl md:p-6">{children}</div>
            </div>
        </div>
    );
}
