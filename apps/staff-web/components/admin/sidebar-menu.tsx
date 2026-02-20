import React from "react";
import {
    type SidebarNavItem,
    LayoutGrid,
    UserRound,
    Hospital,
    List,
    FileText,
} from "@beaulab/ui-admin";

type VisibilityRule = { requiredPermissions?: string[] };
type AppNavSubItem = { name: string; path: string; pro?: boolean; new?: boolean } & VisibilityRule;
type AppNavItem = { name: string; icon: React.ReactNode; path?: string; subItems?: AppNavSubItem[] } & VisibilityRule;

type SidebarMenu = {
    main: SidebarNavItem[];
    others: SidebarNavItem[];
};

const iconClass = "w-5 h-5";

const staffMenu: { main: AppNavItem[]; others: AppNavItem[] } = {
    main: [
        {
            icon: <LayoutGrid className={iconClass} />,
            name: "대시보드",
            path: "/",
            requiredPermissions: ["common.dashboard.show"],
        },
        {
            icon: <Hospital className={iconClass} />,
            name: "병원 관리",
            requiredPermissions: ["beaulab.hospital.show"],
            subItems: [
                { name: "병원 리스트", path: "/hospitals", requiredPermissions: ["beaulab.hospital.show"] },
                { name: "병원 생성", path: "/hospitals/new", requiredPermissions: ["beaulab.hospital.create"] },
            ],
        },
        {
            icon: <UserRound className={iconClass} />,
            name: "내 프로필",
            path: "/profile",
            requiredPermissions: ["common.profile.show"],
        },
        {
            name: "운영",
            icon: <List className={iconClass} />,
            requiredPermissions: ["common.access"],
            subItems: [
                { name: "Form Elements", path: "/form-elements", requiredPermissions: ["beaulab.hospital.create"] },
                { name: "Basic Tables", path: "/basic-tables", requiredPermissions: ["beaulab.hospital.show"] },
            ],
        },
    ],
    others: [
        {
            icon: <FileText className={iconClass} />,
            name: "페이지",
            requiredPermissions: ["common.access"],
            subItems: [
                { name: "Blank Page", path: "/blank", requiredPermissions: ["common.profile.update"] },
                { name: "404 Error", path: "/error-404" },
            ],
        },
    ],
};

function hasAnyPermission(requiredPermissions: string[] | undefined, permissions: string[]) {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    return requiredPermissions.some((permission) => permissions.includes(permission));
}

function toSidebarMenu(menu: { main: AppNavItem[]; others: AppNavItem[] }, permissions: string[]): SidebarMenu {
    const mapItems = (items: AppNavItem[]): SidebarNavItem[] => {
        return items
            .map((item) => {
                if (!hasAnyPermission(item.requiredPermissions, permissions)) return null;

                if (!item.subItems) {
                    const { name, icon, path } = item;
                    return { name, icon, path };
                }

                const subItems = item.subItems
                    .filter((subItem) => hasAnyPermission(subItem.requiredPermissions, permissions))
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

export function buildStaffSidebarMenu(permissions: string[]): SidebarMenu {
    return toSidebarMenu(staffMenu, permissions);
}