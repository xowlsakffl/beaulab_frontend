"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

type SidebarContextType = {
  isMobileOpen: boolean;
  activeItem: string | null;
  openSubmenu: string | null;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  setActiveItem: (item: string | null) => void;
  toggleSubmenu: (item: string) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);
const DESKTOP_LAYOUT_BREAKPOINT = 1300;

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= DESKTOP_LAYOUT_BREAKPOINT) setIsMobileOpen(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMobileSidebar = () => setIsMobileOpen((prev) => !prev);
  const closeMobileSidebar = () => setIsMobileOpen(false);
  const toggleSubmenu = (item: string) => setOpenSubmenu((prev) => (prev === item ? null : item));

  return (
      <SidebarContext.Provider
          value={{
            isMobileOpen,
            activeItem,
            openSubmenu,
            toggleMobileSidebar,
            closeMobileSidebar,
            setActiveItem,
            toggleSubmenu,
          }}
      >
        {children}
      </SidebarContext.Provider>
  );
}
