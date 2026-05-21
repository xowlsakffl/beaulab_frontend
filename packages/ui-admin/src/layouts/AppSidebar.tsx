"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSidebar } from "../context";
import { ChevronDown } from "../icons";

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
};

type AppSidebarProps = {
  menu: {
    main: SidebarNavItem[];
    others?: SidebarNavItem[];
  };
  brand?: SidebarBrand;
  topContent?: ReactNode;
  sectionLabels?: {
    main?: string;
    others?: string;
  };
};

export function AppSidebar({
  menu,
  brand,
  topContent,
  sectionLabels = { main: "Menu", others: "Other" },
}: AppSidebarProps) {
  const { isMobileOpen, closeMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const mainItems = menu.main;
  const otherItems = menu.others ?? [];

  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main" | "others"; index: number } | null>(null);

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

              <span className="menu-item-text">{nav.name}</span>

              <ChevronDown
                className={`ml-auto h-5 w-5 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-white" : "text-white/70"
                }`}
              />
            </button>
          ) : nav.path ? (
            <Link
              href={nav.path}
              onClick={() => {
                if (isMobileOpen) {
                  closeMobileSidebar();
                }
              }}
              className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
            >
              <span className={`${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                {nav.icon ?? <span className="h-5 w-5" />}
              </span>
              <span className="menu-item-text">{nav.name}</span>
            </Link>
          ) : null}

          {nav.subItems ? (
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
                      onClick={() => {
                        if (isMobileOpen) {
                          closeMobileSidebar();
                        }
                      }}
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
      className={`fixed left-0 top-0 z-50 mt-16 flex h-screen w-[290px] flex-col border-r border-[#302E3F] bg-[#302E3F] px-5 text-white transition-transform duration-300 ease-in-out xl:mt-0 ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      } xl:translate-x-0`}
    >
      <div className="flex justify-start py-8">
        {brand ? (
          <Link href={brand.href ?? "/"}>{brand.expandedLogo}</Link>
        ) : null}
      </div>

      {topContent ? <div className="pb-6">{topContent}</div> : null}

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className="mb-4 flex justify-start text-xs uppercase leading-[20px] text-white/55"
              >
                {sectionLabels.main}
              </h2>
              {renderMenuItems(mainItems, "main")}
            </div>

            {otherItems.length > 0 ? (
              <div>
                <h2
                  className="mb-4 flex justify-start text-xs uppercase leading-[20px] text-white/55"
                >
                  {sectionLabels.others}
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
