"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import {
  NotificationDropdown,
  type NotificationDropdownProps,
  UserDropdown,
  type UserDropdownProps,
} from "../components/header";

type AppHeaderProps = {
  pageTitle?: ReactNode;
  headerActions?: ReactNode;
  contentClassName?: string;
  searchPlaceholder?: string;
  searchShortcutLabel?: string;
  showSearch?: boolean;
  notifications?: NotificationDropdownProps | null;
  userMenu?: UserDropdownProps | null;
};

export function AppHeader({
  pageTitle,
  headerActions,
  contentClassName = "",
  searchPlaceholder = "Search or type command...",
  searchShortcutLabel = "Ctrl K",
  showSearch = true,
  notifications = null,
  userMenu = null,
}: AppHeaderProps) {
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
    <header className="sticky top-0 z-99999 flex w-full border-b border-gray-200 bg-white">
      <div className={["w-full grow px-6", contentClassName].filter(Boolean).join(" ")}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4 py-4">
            {pageTitle ? (
              <div className="min-w-0 flex-none">
                <h1 className="truncate text-xl font-semibold tracking-[-0.02em] text-gray-900">
                  {pageTitle}
                </h1>
              </div>
            ) : null}

            {showSearch ? (
              <div>
                <form>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                      <svg className="fill-gray-500" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                      className="h-11 w-[430px] rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
                    />

                    <button className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500">
                      <span>{searchShortcutLabel}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-4 py-4">
            <div className="flex min-w-0 items-center gap-2">
              {headerActions ? <div className="flex min-w-0 items-center gap-2">{headerActions}</div> : null}
              {notifications ? <NotificationDropdown {...notifications} /> : null}
            </div>

            {userMenu ? <UserDropdown {...userMenu} /> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
