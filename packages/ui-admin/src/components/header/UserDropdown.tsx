"use client";

import Image from "next/image";
import React from "react";
import { Dropdown, DropdownItem } from "../ui";

export type UserDropdownItem = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export type UserDropdownProps = {
  name: string;
  subtitle?: string;
  description?: string;
  avatarSrc?: string;
  avatarAlt?: string;
  actionItems?: UserDropdownItem[];
  signOutItem?: UserDropdownItem;
};

function InitialAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
      {initials || "U"}
    </span>
  );
}

export function UserDropdown({
  name,
  subtitle,
  description,
  avatarSrc,
  avatarAlt,
  actionItems = [],
  signOutItem,
}: UserDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  function toggleDropdown(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    event.stopPropagation();
    setIsOpen((previous) => !previous);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="dropdown-toggle flex items-center text-gray-700 dark:text-gray-400"
        aria-label="사용자 메뉴"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
          {avatarSrc ? (
            <Image width={44} height={44} src={avatarSrc} alt={avatarAlt ?? name} />
          ) : (
            <InitialAvatar name={name} />
          )}
        </span>

        <span className="mr-1 block font-medium text-theme-sm">{name}</span>

        <svg
          className={`stroke-gray-500 transition-transform duration-200 dark:stroke-gray-400 ${isOpen ? "rotate-180" : ""}`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          {subtitle ? <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">{subtitle}</span> : null}
          {description ? <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">{description}</span> : null}
        </div>

        {actionItems.length > 0 ? (
          <ul className="flex flex-col gap-1 border-b border-gray-200 pb-3 pt-4 dark:border-gray-800">
            {actionItems.map((item, index) => (
              <li key={`${item.label}-${index}`}>
                <DropdownItem
                  onItemClick={closeDropdown}
                  onClick={item.onClick}
                  tag={item.href ? "a" : "button"}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                  {item.label}
                </DropdownItem>
              </li>
            ))}
          </ul>
        ) : null}

        {signOutItem ? (
          <DropdownItem
            onItemClick={closeDropdown}
            onClick={signOutItem.onClick}
            tag={signOutItem.href ? "a" : "button"}
            href={signOutItem.href}
            className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            {signOutItem.label}
          </DropdownItem>
        ) : null}
      </Dropdown>
    </div>
  );
}
