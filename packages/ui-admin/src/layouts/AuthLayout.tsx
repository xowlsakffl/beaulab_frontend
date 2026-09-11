import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

import { GridShape } from "../components/common/GridShape";

type AuthLayoutProps = {
  children: ReactNode;
  brandDescription: string;
  brandName?: string;
  logoSrc?: string;
  loginHref?: string;
  className?: string;
};

export function AuthLayout({
  children,
  brandDescription,
  brandName = "뷰랩 관리자",
  logoSrc = "/images/logo/board_logo_dark.png",
  loginHref = "/login",
  className,
}: AuthLayoutProps) {
  return (
    <main className={twMerge("relative z-1 flex min-h-dvh w-full bg-white", className)}>
      <section className="flex min-w-0 flex-1 px-6 py-10 min-[640px]:px-10 min-[1024px]:px-16">{children}</section>
      <aside className="relative hidden w-1/2 shrink-0 items-center justify-center overflow-hidden bg-brand-950 min-[1024px]:flex">
        <div className="relative z-1 flex w-full items-center justify-center">
          <GridShape />
          <div className="flex max-w-xs flex-col items-center">
            <Link href={loginHref} className="mb-4 block">
              <Image width={231} height={48} src={logoSrc} alt={brandName} className="h-auto w-[231px]" priority />
            </Link>
            <p className="text-center break-keep text-gray-400">{brandDescription}</p>
          </div>
        </div>
      </aside>
    </main>
  );
}
