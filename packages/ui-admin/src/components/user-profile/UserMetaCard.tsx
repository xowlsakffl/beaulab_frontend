import type { ReactNode } from "react";
import Image from "next/image";

export type UserMetaCardProps = {
  name: string;
  subtitle?: string;
  description?: string;
  location?: string;
  avatarSrc?: string;
  avatarAlt?: string;
  actions?: ReactNode;
};

function FallbackAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-lg font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
      {initials || "U"}
    </div>
  );
}

export default function UserMetaCard({
  name,
  subtitle,
  description,
  location,
  avatarSrc,
  avatarAlt,
  actions,
}: UserMetaCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-full flex-col items-center gap-6 xl:flex-row">
          <div className="h-20 w-20 overflow-hidden rounded-full border border-gray-200 dark:border-gray-800">
            {avatarSrc ? (
              <Image width={80} height={80} src={avatarSrc} alt={avatarAlt ?? name} className="h-20 w-20 object-cover" />
            ) : (
              <FallbackAvatar name={name} />
            )}
          </div>
          <div>
            <h4 className="mb-2 text-center text-lg font-semibold text-gray-800 dark:text-white/90 xl:text-left">{name}</h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              {subtitle ? <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p> : null}
              {subtitle && location ? <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div> : null}
              {location ? <p className="text-sm text-gray-500 dark:text-gray-400">{location}</p> : null}
            </div>
            {description ? <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2 xl:justify-end">{actions}</div> : null}
      </div>
    </div>
  );
}
