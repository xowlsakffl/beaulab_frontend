import React from "react";
import {
    type SidebarNavItem,
    LayoutGrid,
    UserRound,
    Hospital,
    SquarePlus,
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
            name: "병의원 관리",
            requiredPermissions: ["beaulab.hospital.show"],
            subItems: [
                { name: "병의원 목록", path: "/hospitals", requiredPermissions: ["beaulab.hospital.show"] },
                { name: "병의원 등록", path: "/hospitals/new", requiredPermissions: ["beaulab.hospital.create"] },
            ],
        },
        {
            icon: <SquarePlus className={iconClass} />,
            name: "병의원 등록",
            path: "/hospitals/new",
            requiredPermissions: ["beaulab.hospital.create"],
        },
        {
            icon: <UserRound className={iconClass} />,
            name: "내 프로필",
            path: "/profile",
            requiredPermissions: ["common.profile.show"],
        },
    ],
    others: [],
};

function hasAnyPermission(requiredPermissions: string[] | undefined, permissions: string[]) {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    return requiredPermissions.some((permission) => permissions.includes(permission));
}

function toSidebarMenu(menu: { main: AppNavItem[]; others: AppNavItem[] }, permissions: string[]): SidebarMenu {
    const mapItems = (items: AppNavItem[]): SidebarNavItem[] => {
        const mappedItems: SidebarNavItem[] = [];

        items.forEach((item) => {
            if (!hasAnyPermission(item.requiredPermissions, permissions)) return;

            if (!item.subItems) {
                const { name, icon, path } = item;
                mappedItems.push({ name, icon, path });
                return;
            }

            const subItems = item.subItems
                .filter((subItem) => hasAnyPermission(subItem.requiredPermissions, permissions))
                .map(({ name, path, pro, new: isNew }) => ({ name, path, pro, new: isNew }));

            if (subItems.length === 0) return;

            const { name, icon, path } = item;
            mappedItems.push({ name, icon, path, subItems });
        });

        return mappedItems;
    };

    return {
        main: mapItems(menu.main),
        others: mapItems(menu.others),
    };
}

export function buildStaffSidebarMenu(permissions: string[]): SidebarMenu {
    return toSidebarMenu(staffMenu, permissions);
}
