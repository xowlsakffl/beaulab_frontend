import { GridShape } from "@beaulab/ui-admin";

import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-1 w-full min-w-[1440px] bg-white p-0">
        <div className="relative flex h-screen w-full min-w-[1440px] flex-row justify-center p-0">
          {children}
          <div className="grid h-full min-w-[720px] flex-1 items-center bg-brand-950">
            <div className="relative items-center justify-center  flex z-1">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              <GridShape />
              <div className="flex flex-col items-center max-w-xs">
                <Link href="/login" className="block mb-4">
                  <Image
                    width={231}
                    height={48}
                    src="/images/logo/board_logo_dark.png"
                    alt="뷰랩 관리자"
                  />
                </Link>
                <p className="text-center text-gray-400 ">
                  병의원 운영 뷰랩 관리자입니다.
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
