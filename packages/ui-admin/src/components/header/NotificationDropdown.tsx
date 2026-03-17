"use client";

import Image from "next/image";
import React from "react";
import { Bell } from "lucide-react";
import { Dropdown, DropdownItem } from "../ui";

export type NotificationItem = {
  id: string | number;
  title: string;
  description?: string;
  meta?: string;
  timeLabel?: string;
  href?: string;
  avatarSrc?: string;
  avatarAlt?: string;
  unread?: boolean;
  tone?: "success" | "warning" | "error" | "neutral";
};

export type NotificationDropdownProps = {
  title?: string;
  items?: NotificationItem[];
  emptyText?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
};

const toneClassNames: Record<NonNullable<NotificationItem["tone"]>, string> = {
  success: "bg-success-500",
  warning: "bg-orange-400",
  error: "bg-error-500",
  neutral: "bg-gray-400",
};

function NotificationAvatar({ item }: { item: NotificationItem }) {
  if (item.avatarSrc) {
    return (
      <Image
        width={40}
        height={40}
        src={item.avatarSrc}
        alt={item.avatarAlt ?? item.title}
        className="h-10 w-10 overflow-hidden rounded-full"
      />
    );
  }

  const initial = item.title.charAt(0).toUpperCase();

  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
      {initial}
    </span>
  );
}

export function NotificationDropdown({
  title = "알림",
  items = [],
  emptyText = "새 알림이 없습니다.",
  viewAllHref,
  viewAllLabel = "모든 알림 보기",
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [dismissedUnread, setDismissedUnread] = React.useState(false);

  const hasUnread = React.useMemo(
    () => items.some((item) => item.unread) && !dismissedUnread,
    [dismissedUnread, items],
  );

  const toggleDropdown = () => {
    setIsOpen((previous) => !previous);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleClick = () => {
    toggleDropdown();
    setDismissedUnread(true);
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
        aria-label={title}
      >
        <span className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${!hasUnread ? "hidden" : "flex"}`}>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
        </span>
        <Bell className="h-5 w-5" />
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h5>
          <button
            onClick={toggleDropdown}
            className="dropdown-toggle text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label={`${title} 닫기`}
          >
            <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        <ul className="custom-scrollbar flex h-auto flex-col overflow-y-auto">
          {items.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">{emptyText}</li>
          ) : (
            items.map((item) => {
              const tone = toneClassNames[item.tone ?? "neutral"];

              return (
                <li key={item.id}>
                  <DropdownItem
                    tag={item.href ? "a" : "button"}
                    href={item.href}
                    onItemClick={closeDropdown}
                    className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                  >
                    <span className="relative block h-10 w-10 flex-none rounded-full">
                      <NotificationAvatar item={item} />
                      <span className={`absolute bottom-0 right-0 z-10 h-2.5 w-2.5 rounded-full border-[1.5px] border-white dark:border-gray-900 ${tone}`}></span>
                    </span>
                    <span className="block">
                      <span className="mb-1.5 block text-theme-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-800 dark:text-white/90">{item.title}</span>
                        {item.description ? <span className="ml-1">{item.description}</span> : null}
                      </span>
                      {item.meta || item.timeLabel ? (
                        <span className="flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
                          {item.meta ? <span>{item.meta}</span> : null}
                          {item.meta && item.timeLabel ? <span className="h-1 w-1 rounded-full bg-gray-400"></span> : null}
                          {item.timeLabel ? <span>{item.timeLabel}</span> : null}
                        </span>
                      ) : null}
                    </span>
                  </DropdownItem>
                </li>
              );
            })
          )}
        </ul>
        {viewAllHref ? (
          <DropdownItem
            tag="a"
            href={viewAllHref}
            onItemClick={closeDropdown}
            className="mt-3 block rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            {viewAllLabel}
          </DropdownItem>
        ) : null}
      </Dropdown>
    </div>
  );
}
