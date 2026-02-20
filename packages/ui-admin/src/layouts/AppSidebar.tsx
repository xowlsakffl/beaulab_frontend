"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { useSidebar } from "../context";

import {
  Box,
  CalendarDays,
  ChevronDown,
  FileText,
  LayoutGrid,
  List,
  MoreHorizontal,
  PieChart,
  Plug,
  Table,
  UserRound,
} from "../icons";

export type SidebarNavSubItem = {
  name: string;
  path: string;
};

export type SidebarNavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SidebarNavSubItem[];
};

const iconClass = "w-5 h-5";

const defaultMainItems: SidebarNavItem[] = [
  {
    icon: <LayoutGrid className={iconClass} />,
    name: "Dashboard",
    subItems: [{ name: "Ecommerce", path: "/" }],
  },
  { icon: <CalendarDays className={iconClass} />, name: "Calendar", path: "/calendar" },
  { icon: <UserRound className={iconClass} />, name: "User Profile", path: "/profile" },
  { name: "Forms", icon: <List className={iconClass} />, subItems: [{ name: "Form Elements", path: "/form-elements" }] },
  { name: "Tables", icon: <Table className={iconClass} />, subItems: [{ name: "Basic Tables", path: "/basic-tables" }] },
  {
    name: "Pages",
    icon: <FileText className={iconClass} />,
    subItems: [
      { name: "Blank Page", path: "/blank" },
      { name: "404 Error", path: "/error-404" },
    ],
  },
];

const defaultOtherItems: SidebarNavItem[] = [
  {
    icon: <PieChart className={iconClass} />,
    name: "Charts",
    subItems: [
      { name: "Line Chart", path: "/line-chart" },
      { name: "Bar Chart", path: "/bar-chart" },
    ],
  },
  {
    icon: <Box className={iconClass} />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "/alerts" },
      { name: "Avatar", path: "/avatars" },
      { name: "Badge", path: "/badge" },
      { name: "Buttons", path: "/buttons" },
      { name: "Images", path: "/images" },
      { name: "Videos", path: "/videos" },
    ],
  },
  {
    icon: <Plug className={iconClass} />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin" },
      { name: "Sign Up", path: "/signup" },
    ],
  },
];

type AppSidebarProps = {
  menu?: {
    main: SidebarNavItem[];
    others: SidebarNavItem[];
  };
};

export function AppSidebar({ menu }: AppSidebarProps) {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const mainItems = menu?.main ?? defaultMainItems;
  const otherItems = menu?.others ?? defaultOtherItems;

  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main" | "others"; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === menuType && prev.index === index) return null;
      return { type: menuType, index };
    });
  };

  const updateSubMenuHeights = useCallback(() => {
    const nextHeights: Record<string, number> = {};

    Object.entries(subMenuRefs.current).forEach(([key, el]) => {
      if (!el) return;
      nextHeights[key] = el.scrollHeight || 0;
    });

    if (Object.keys(nextHeights).length > 0) {
      setSubMenuHeight((prev) => ({ ...prev, ...nextHeights }));
    }
  }, []);

  const renderMenuItems = (items: SidebarNavItem[], menuType: "main" | "others") => (
      <ul className="flex flex-col gap-4">
        {items.map((nav, index) => (
            <li key={nav.name}>
              {nav.subItems ? (
                  <button
                      onClick={() => handleSubmenuToggle(index, menuType)}
                      className={`menu-item group ${
                          openSubmenu?.type === menuType && openSubmenu?.index === index ? "menu-item-active" : "menu-item-inactive"
                      } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
                  >
              <span
                  className={`${
                      openSubmenu?.type === menuType && openSubmenu?.index === index ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>

                    {(isExpanded || isHovered || isMobileOpen) && <span className="menu-item-text">{nav.name}</span>}

                    {(isExpanded || isHovered || isMobileOpen) && (
                        <ChevronDown
                            className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                                openSubmenu?.type === menuType && openSubmenu?.index === index ? "rotate-180 text-brand-500" : ""
                            }`}
                        />
                    )}
                  </button>
              ) : (
                  nav.path && (
                      <Link href={nav.path} className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}>
                        <span className={`${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>{nav.icon}</span>
                        {(isExpanded || isHovered || isMobileOpen) && <span className="menu-item-text">{nav.name}</span>}
                      </Link>
                  )
              )}

              {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
                  <div
                      ref={(el) => {
                        subMenuRefs.current[`${menuType}-${index}`] = el;
                      }}
                      className="overflow-hidden transition-all duration-300"
                      style={{
                        height:
                            openSubmenu?.type === menuType && openSubmenu?.index === index
                                ? `${subMenuHeight[`${menuType}-${index}`]}px`
                                : "0px",
                      }}
                  >
                    <ul className="mt-2 space-y-1 ml-9">
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
              )}
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

  useEffect(() => {
    updateSubMenuHeights();
  }, [openSubmenu, isExpanded, isHovered, isMobileOpen, updateSubMenuHeights]);

  useEffect(() => {
    if (!isExpanded && !isHovered && !isMobileOpen) return;

    updateSubMenuHeights();

    const rafId = window.requestAnimationFrame(updateSubMenuHeights);
    const timeoutId = window.setTimeout(updateSubMenuHeights, 350);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [isExpanded, isHovered, isMobileOpen, updateSubMenuHeights]);

  return (
      <aside
          className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
          onMouseEnter={() => !isExpanded && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTransitionEnd={(event) => {
            if (event.propertyName === "width") updateSubMenuHeights();
          }}
      >
        <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
          <Link href="/">
            {isExpanded || isHovered || isMobileOpen ? (
                <>
                  <Image className="dark:hidden" src="/images/logo/logo.svg" alt="Logo" width={150} height={40} />
                  <Image className="hidden dark:block" src="/images/logo/logo-dark.svg" alt="Logo" width={150} height={40} />
                </>
            ) : (
                <Image src="/images/logo/logo-icon.svg" alt="Logo" width={32} height={32} />
            )}
          </Link>
        </div>

        <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
          <nav className="mb-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2
                    className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                        !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                    }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? "Menu" : <MoreHorizontal className="w-5 h-5" />}
                </h2>
                {renderMenuItems(mainItems, "main")}
              </div>

              <div>
                <h2
                    className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                        !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                    }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? "Others" : <MoreHorizontal className="w-5 h-5" />}
                </h2>
                {renderMenuItems(otherItems, "others")}
              </div>
            </div>
          </nav>
        </div>
      </aside>
  );
}
