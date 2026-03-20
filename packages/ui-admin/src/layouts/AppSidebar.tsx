"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSidebar } from "../context";
import { ChevronDown, MoreHorizontal } from "../icons";

export type SidebarNavSubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
};

export type SidebarNavItem = {
  name: string;
  icon?: ReactNode;
  path?: string;
  subItems?: SidebarNavSubItem[];
};

export type SidebarBrand = {
  href?: string;
  expandedLogo: ReactNode;
  collapsedLogo?: ReactNode;
};

type AppSidebarProps = {
  menu: {
    main: SidebarNavItem[];
    others?: SidebarNavItem[];
  };
  brand?: SidebarBrand;
  sectionLabels?: {
    main?: string;
    others?: string;
  };
};

export function AppSidebar({
  menu,
  brand,
  sectionLabels = { main: "Menu", others: "Other" },
}: AppSidebarProps) {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const mainItems = menu.main;
  const otherItems = menu.others ?? [];

  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main" | "others"; index: number } | null>(null);
  const [showHoverLabels, setShowHoverLabels] = useState(false);

  const canShowMenuContent = isExpanded || isMobileOpen || showHoverLabels;

  const isActive = useCallback(
    (path: string) => {
      if (path === "/") return pathname === "/";
      return pathname === path || pathname?.startsWith(`${path}/`) === true;
    },
    [pathname],
  );

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((previous) => {
      if (previous && previous.type === menuType && previous.index === index) return null;
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: SidebarNavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {(() => {
            const hasActiveSubItem = nav.subItems?.some((subItem) => isActive(subItem.path)) ?? false;
            const isOpen = openSubmenu?.type === menuType && openSubmenu?.index === index;
            const isParentActive = isOpen || hasActiveSubItem;

            return (
              <>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${isParentActive ? "menu-item-active" : "menu-item-inactive"} cursor-pointer`}
              aria-label={nav.name}
            >
              <span
                className={`${isParentActive ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}
              >
                {nav.icon ?? <span className="h-5 w-5" />}
              </span>

              {canShowMenuContent ? <span className="menu-item-text">{nav.name}</span> : null}

              {canShowMenuContent ? (
                <ChevronDown
                  className={`ml-auto h-5 w-5 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-brand-500" : ""
                  }`}
                />
              ) : null}
            </button>
          ) : nav.path ? (
            <Link href={nav.path} className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}>
              <span className={`${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                {nav.icon ?? <span className="h-5 w-5" />}
              </span>
              {canShowMenuContent ? <span className="menu-item-text">{nav.name}</span> : null}
            </Link>
          ) : null}

          {nav.subItems && canShowMenuContent ? (
            <div
              className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen
                  ? "mt-2 grid-rows-[1fr] opacity-100"
                  : "mt-0 grid-rows-[0fr] opacity-0"
              }`}
            >
              <ul className="ml-9 min-h-0 space-y-1">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"}`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
              </>
            );
          })()}
        </li>
      ))}
    </ul>
  );

  useEffect(() => {
    if (isExpanded || isMobileOpen) {
      setShowHoverLabels(true);
      return;
    }

    if (isHovered) {
      const timerId = window.setTimeout(() => setShowHoverLabels(true), 220);
      return () => window.clearTimeout(timerId);
    }

    setShowHoverLabels(false);
  }, [isExpanded, isHovered, isMobileOpen]);

  useEffect(() => {
    let submenuMatched = false;

    (["main", "others"] as const).forEach((menuType) => {
      const items = menuType === "main" ? mainItems : otherItems;
      items.forEach((nav, index) => {
        nav.subItems?.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: menuType, index });
            submenuMatched = true;
          }
        });
      });
    });

    if (!submenuMatched) setOpenSubmenu(null);
  }, [pathname, isActive, mainItems, otherItems]);

  return (
    <aside
      className={`fixed left-0 top-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 xl:mt-0 ${
        isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} xl:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex py-8 ${!isExpanded && !showHoverLabels ? "xl:justify-center" : "justify-start"}`}>
        {brand ? (
          <Link href={brand.href ?? "/"}>{canShowMenuContent ? brand.expandedLogo : brand.collapsedLogo ?? brand.expandedLogo}</Link>
        ) : null}
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 flex text-xs uppercase leading-[20px] text-gray-400 ${
                  !isExpanded && !showHoverLabels ? "xl:justify-center" : "justify-start"
                }`}
              >
                {canShowMenuContent ? sectionLabels.main : <MoreHorizontal className="h-5 w-5" />}
              </h2>
              {renderMenuItems(mainItems, "main")}
            </div>

            {otherItems.length > 0 ? (
              <div>
                <h2
                  className={`mb-4 flex text-xs uppercase leading-[20px] text-gray-400 ${
                    !isExpanded && !showHoverLabels ? "xl:justify-center" : "justify-start"
                  }`}
                >
                  {canShowMenuContent ? sectionLabels.others : <MoreHorizontal className="h-5 w-5" />}
                </h2>
                {renderMenuItems(otherItems, "others")}
              </div>
            ) : null}
          </div>
        </nav>
      </div>
    </aside>
  );
}
