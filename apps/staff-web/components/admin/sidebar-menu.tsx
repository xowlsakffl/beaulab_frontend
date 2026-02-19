import React from "react";
import {
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

type ActorType = "staff" | "partner";
type VisibilityRule = { roles?: ActorType[]; permissions?: string[] };
type AppNavSubItem = { name: string; path: string; pro?: boolean; new?: boolean } & VisibilityRule;
type AppNavItem = { name: string; icon: React.ReactNode; path?: string; subItems?: AppNavSubItem[] } & VisibilityRule;

type SidebarMenu = {
    main: SidebarNavItem[];
    others: SidebarNavItem[];
};

const iconClass = "w-5 h-5";

const staffMenu: { main: AppNavItem[]; others: AppNavItem[] } = {
    main: [
        { icon: <LayoutGrid className={iconClass} />, name: "대시보드", path: "/", roles: ["staff"] },
        {
            icon: <CalendarDays className={iconClass} />,
            name: "예약 캘린더",
            path: "/calendar",
            roles: ["staff"],
            permissions: ["reservation.read"],
        },
        { icon: <UserRound className={iconClass} />, name: "내 프로필", path: "/profile", roles: ["staff"] },
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

const partnerMenu: { main: AppNavItem[]; others: AppNavItem[] } = {
    main: [
        { icon: <LayoutGrid className={iconClass} />, name: "파트너 대시보드", path: "/", roles: ["partner"] },
        {
            icon: <Table className={iconClass} />,
            name: "주문 관리",
            path: "/basic-tables",
            roles: ["partner"],
            permissions: ["order.read"],
        },
        { icon: <UserRound className={iconClass} />, name: "파트너 정보", path: "/profile", roles: ["partner"] },
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

function canView(rule: VisibilityRule, actor: ActorType, permissions: string[]) {
    const roleAllowed = !rule.roles || rule.roles.includes(actor);
    const permissionAllowed = !rule.permissions || rule.permissions.some((permission) => permissions.includes(permission));
    return roleAllowed && permissionAllowed;
}

function toSidebarMenu(menu: { main: AppNavItem[]; others: AppNavItem[] }, actor: ActorType, permissions: string[]): SidebarMenu {
    const mapItems = (items: AppNavItem[]): SidebarNavItem[] => {
        return items
            .map((item) => {
                if (!canView(item, actor, permissions)) return null;

                if (!item.subItems) {
                    const { name, icon, path } = item;
                    return { name, icon, path };
                }

                const subItems = item.subItems
                    .filter((subItem) => canView(subItem, actor, permissions))
                    .map(({ name, path, pro, new: isNew }) => ({ name, path, pro, new: isNew }));

                if (subItems.length === 0) return null;

                const { name, icon, path } = item;
                return { name, icon, path, subItems };
            })
            .filter((item): item is SidebarNavItem => item !== null);
    };

    return {
        main: mapItems(menu.main),
        others: mapItems(menu.others),
    };
}

export function buildSidebarMenu(actor: ActorType, permissions: string[]): SidebarMenu {
    const sourceMenu = actor === "partner" ? partnerMenu : staffMenu;
    return toSidebarMenu(sourceMenu, actor, permissions);
}
