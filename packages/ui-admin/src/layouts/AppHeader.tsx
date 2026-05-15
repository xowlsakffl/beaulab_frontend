"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { ThemeToggleButton } from "../components/common";
import {
  NotificationDropdown,
  type NotificationDropdownProps,
  UserDropdown,
  type UserDropdownProps,
} from "../components/header";
import { useSidebar } from "../context";

type AppHeaderProps = {
  mobileHomeHref?: string;
  mobileLogo?: ReactNode;
  pageTitle?: ReactNode;
  headerActions?: ReactNode;
  searchPlaceholder?: string;
  searchShortcutLabel?: string;
  showSearch?: boolean;
  showThemeToggle?: boolean;
  notifications?: NotificationDropdownProps | null;
  userMenu?: UserDropdownProps | null;
};

export function AppHeader({
  mobileHomeHref = "/",
  mobileLogo,
  pageTitle,
  headerActions,
  searchPlaceholder = "Search or type command...",
  searchShortcutLabel = "Ctrl K",
  showSearch = true,
  showThemeToggle = true,
  notifications = null,
  userMenu = null,
}: AppHeaderProps) {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen((value) => !value);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-99999 flex w-full border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 xl:border-b">
      <div className="grow xl:px-6">
        <div className="flex flex-col items-center justify-between xl:flex-row">
          <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 dark:border-gray-800 sm:gap-4 xl:justify-normal xl:border-b-0 xl:px-0 xl:py-4">
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="z-99999 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 xl:hidden"
              aria-label={isMobileOpen ? "Close Sidebar" : "Open Sidebar"}
            >
              {isMobileOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.21967 6.21967C6.51256 5.92678 6.98744 5.92678 7.28033 6.21967L12 10.9393L16.7197 6.21967C17.0126 5.92678 17.4874 5.92678 17.7803 6.21967C18.0732 6.51256 18.0732 6.98744 17.7803 7.28033L13.0607 12L17.7803 16.7197C18.0732 17.0126 18.0732 17.4874 17.7803 17.7803C17.4874 18.0732 17.0126 18.0732 16.7197 17.7803L12 13.0607L7.28033 17.7803C6.98744 18.0732 6.51256 18.0732 6.21967 17.7803C5.92678 17.4874 5.92678 17.0126 6.21967 16.7197L10.9393 12L6.21967 7.28033C5.92678 6.98744 5.92678 6.51256 6.21967 6.21967Z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.75 6.75C3.75 6.33579 4.08579 6 4.5 6H19.5C19.9142 6 20.25 6.33579 20.25 6.75C20.25 7.16421 19.9142 7.5 19.5 7.5H4.5C4.08579 7.5 3.75 7.16421 3.75 6.75ZM3.75 12C3.75 11.5858 4.08579 11.25 4.5 11.25H19.5C19.9142 11.25 20.25 11.5858 20.25 12C20.25 12.4142 19.9142 12.75 19.5 12.75H4.5C4.08579 12.75 3.75 12.4142 3.75 12ZM4.5 16.5C4.08579 16.5 3.75 16.8358 3.75 17.25C3.75 17.6642 4.08579 18 4.5 18H19.5C19.9142 18 20.25 17.6642 20.25 17.25C20.25 16.8358 19.9142 16.5 19.5 16.5H4.5Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>

            {pageTitle ? (
              <div className="hidden min-w-0 flex-1 xl:block xl:flex-none">
                <h1 className="truncate text-base font-semibold tracking-[-0.02em] text-gray-900 dark:text-white xl:text-xl">
                  {pageTitle}
                </h1>
              </div>
            ) : null}

            {mobileLogo ? (
              <Link href={mobileHomeHref} className="xl:hidden">
                {mobileLogo}
              </Link>
            ) : null}

            <button
              onClick={toggleApplicationMenu}
              className="z-99999 flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 xl:hidden"
              aria-label="Toggle Header Menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                  fill="currentColor"
                />
              </svg>
            </button>

            {showSearch ? (
              <div className="hidden xl:block">
                <form>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                      <svg className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>

                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={searchPlaceholder}
                      className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                    />

                    <button className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                      <span>{searchShortcutLabel}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="hidden xl:block" />
            )}
          </div>

          <div
            className={`${isApplicationMenuOpen ? "flex" : "hidden"} w-full items-center justify-between gap-4 px-5 py-4 shadow-theme-md xl:flex xl:justify-end xl:px-0 xl:shadow-none`}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2 2xsm:gap-3">
              {headerActions ? <div className="flex min-w-0 items-center gap-2">{headerActions}</div> : null}
              {showThemeToggle ? <ThemeToggleButton /> : null}
              {notifications ? <NotificationDropdown {...notifications} /> : null}
            </div>

            {userMenu ? <UserDropdown {...userMenu} /> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
