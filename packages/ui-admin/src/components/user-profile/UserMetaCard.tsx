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
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-lg font-semibold text-gray-700">
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
    <div className="rounded-2xl border border-gray-200 p-5 lg:p-6">
      <div className="flex flex-row items-center justify-between gap-5">
        <div className="flex w-full flex-row items-center gap-6">
          <div className="h-20 w-20 overflow-hidden rounded-full border border-gray-200">
            {avatarSrc ? (
              <Image
                width={80}
                height={80}
                src={avatarSrc}
                alt={avatarAlt ?? name}
                className="h-20 w-20 object-cover"
              />
            ) : (
              <FallbackAvatar name={name} />
            )}
          </div>
          <div>
            <h4 className="mb-2 text-left text-lg font-semibold text-gray-800">{name}</h4>
            <div className="flex flex-row items-center gap-3 text-left">
              {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
              {subtitle && location ? <div className="block h-3.5 w-px bg-gray-300"></div> : null}
              {location ? <p className="text-sm text-gray-500">{location}</p> : null}
            </div>
            {description ? <p className="mt-2 text-sm text-gray-500">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex items-center justify-end gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
